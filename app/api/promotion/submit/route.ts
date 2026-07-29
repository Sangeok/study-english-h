import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { calculateRetryAvailability } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { PROMOTION, getNextLevel } from "@/shared/constants";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import {
  enrollWordsToSrs,
  type QuizWordOutcome,
} from "@/features/flashcard/lib/srs-enrollment";

const submitSchema = z.object({
  sessionId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedText: z.string(),
      })
    )
    .length(PROMOTION.QUESTION_COUNT),
});

type GuardReason = "session-invalid" | "cooldown" | "level-changed";

/**
 * 트랜잭션 안에서 던져 롤백을 강제하는 가드 거절.
 * 롤백이라 세션 `consumedAt` 이 채워지지 않는다 — 쿨다운·레벨 경합으로 튕긴 사용자가
 * 응시권까지 잃지는 않는다(§4-2).
 */
class PromotionGuardError extends Error {
  constructor(readonly reason: GuardReason) {
    super(reason);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    // --- 1) 형태 fast-fail (락 밖) ---
    const parsedBody = submitSchema.safeParse(await req.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: `답안은 ${PROMOTION.QUESTION_COUNT}문항이어야 해요` },
        { status: 400 }
      );
    }

    const { sessionId, answers } = parsedBody.data;

    const submittedIds = answers.map((answer) => answer.questionId);
    if (new Set(submittedIds).size !== submittedIds.length) {
      return NextResponse.json({ error: "중복된 문항이 있어요" }, { status: 400 });
    }

    // 문항은 불변 콘텐츠라 락 밖에서 한 번만 읽고 채점·difficulty 검증에 재사용한다.
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: submittedIds } },
      include: { options: true },
    });

    if (questions.length !== PROMOTION.QUESTION_COUNT) {
      return NextResponse.json({ error: "존재하지 않는 문항이 있어요" }, { status: 400 });
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));

    // --- 2) 트랜잭션 + 잠금 (§4-2 잠금 규약) ---
    const graded = await prisma
      .$transaction(async (transaction) => {
        const lockKey = `promotion:${userId}`;

        await transaction.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${lockKey}::text, 0)
          )::text AS "lockResult"
        `;

        // (a) 응시 세션 소비 — 진행률 게이트 우회와 문항 선별 치팅을 여기서 막는다.
        const promotionSession = await transaction.levelPromotionSession.findUnique({
          where: { id: sessionId },
        });

        const ttlCutoff = new Date(Date.now() - PROMOTION.SESSION_TTL_MINUTES * 60 * 1000);
        const issuedIds = new Set(promotionSession?.questionIds ?? []);
        const sameQuestionSet =
          issuedIds.size === submittedIds.length &&
          submittedIds.every((id) => issuedIds.has(id));

        if (
          !promotionSession ||
          promotionSession.userId !== userId ||
          promotionSession.consumedAt !== null ||
          promotionSession.createdAt < ttlCutoff ||
          !sameQuestionSet
        ) {
          throw new PromotionGuardError("session-invalid");
        }

        // (b) 레벨 권위 재검증
        const profile = await transaction.userProfile.findUnique({
          where: { userId },
          select: { level: true },
        });
        const parsedLevel = cefrLevelSchema.safeParse(profile?.level);
        const level = parsedLevel.success ? parsedLevel.data : "A1";
        const expected = getNextLevel(level);

        // 레벨 드리프트 — 재시도해도 영구히 같은 이유로 거부되므로 복구는 "다시 시작"뿐이다.
        //   400 으로 두면 클라이언트가 일반 오류 화면에 갇혀 재시도 루프가 된다.
        if (!expected || promotionSession.toLevel !== expected) {
          throw new PromotionGuardError("level-changed");
        }

        // 콘텐츠 드리프트 — (a)가 제출 집합을 세션에 고정하므로, 여기까지 오는 경우는
        //   발급 후 DB 에서 문항 difficulty 가 바뀐 서버측 이상뿐이다.
        const allSameDifficulty = questions.every(
          (question) => question.difficulty === promotionSession.toLevel
        );
        if (!allSameDifficulty) {
          return { kind: "content-drift" as const };
        }

        // (c) 쿨다운 재확인 — 진행률 비의존 술어라 getLevelProgress 를 부르지 않는다.
        const lastFailed = await transaction.levelPromotionAttempt.findFirst({
          where: { userId, passed: false },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        const retry = calculateRetryAvailability(lastFailed?.createdAt ?? null);
        if (!retry.canRetry) {
          throw new PromotionGuardError("cooldown");
        }

        // (d) 서버 재채점 — 클라이언트의 판정은 신뢰하지 않는다.
        const wrongWords: string[] = [];
        let correctCount = 0;
        for (const answer of answers) {
          const question = questionMap.get(answer.questionId);
          if (!question) continue;
          const correctOption = question.options.find((option) => option.isCorrect);
          if (correctOption && correctOption.text === answer.selectedText) {
            correctCount += 1;
          } else {
            wrongWords.push(question.englishWord);
          }
        }

        const passed = correctCount >= PROMOTION.PASS_COUNT;

        // (e) 통과면 조건부 갱신(CAS) — 재진단 라우트와 lock 키가 달라 락으로는 배제되지 않는다.
        if (passed) {
          const { count } = await transaction.userProfile.updateMany({
            where: { userId, level },
            data: { level: expected },
          });

          if (count !== 1) {
            throw new PromotionGuardError("level-changed");
          }
        }

        // (f) 응시 기록 — UserQuizAttempt 가 아니다(데일리 완료 판정 오염 방지).
        await transaction.levelPromotionAttempt.create({
          data: { userId, fromLevel: level, toLevel: expected, correctCount, passed },
        });

        // (g) 세션 소진 — 채점 결과와 무관하게 재사용을 차단한다.
        await transaction.levelPromotionSession.update({
          where: { id: promotionSession.id },
          data: { consumedAt: new Date() },
        });

        return { kind: "graded" as const, passed, correctCount, newLevel: expected, wrongWords };
      })
      .catch((error: unknown) => {
        if (error instanceof PromotionGuardError) {
          return { kind: "rejected" as const, reason: error.reason };
        }
        throw error;
      });

    if (graded.kind === "rejected") {
      return NextResponse.json(
        { error: "이번 응시를 채점할 수 없어요", reason: graded.reason },
        { status: 409 }
      );
    }

    if (graded.kind === "content-drift") {
      return NextResponse.json({ error: "문항 정보가 올바르지 않아요" }, { status: 400 });
    }

    if (graded.passed) {
      return NextResponse.json({
        passed: true,
        correctCount: graded.correctCount,
        newLevel: graded.newLevel,
      });
    }

    // --- 3) 트랜잭션 밖(best-effort): 틀린 단어 SRS 편입 ---
    //   라우트(app 레이어)가 features/flashcard 를 오케스트레이션한다 — features → features 없음.
    //   승급 시험에는 힌트가 없으므로 usedHint 는 항상 false 다.
    const outcomes: QuizWordOutcome[] = graded.wrongWords.map((word) => ({
      word,
      isCorrect: false,
      usedHint: false,
    }));
    const enrollment = await enrollWordsToSrs(userId, outcomes);

    return NextResponse.json({
      passed: false,
      correctCount: graded.correctCount,
      enrolledCount: enrollment?.enrolledCount ?? null,
    });
  } catch (error) {
    console.error("Promotion submit error:", error);
    return NextResponse.json(
      { error: "채점 중 오류가 발생했어요" },
      { status: 500 }
    );
  }
}
