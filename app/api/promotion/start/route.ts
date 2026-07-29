import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { derivePromotionStatus, getLevelProgress } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { shuffleArray } from "@/shared/lib";
import { PROMOTION, getNextLevel } from "@/shared/constants";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";

type PromotionQuestion = Prisma.QuizQuestionGetPayload<{ include: { options: true } }>;

const QUESTION_INCLUDE = { options: { orderBy: { order: "asc" as const } } };

/**
 * 문항 선정 (§4-2): 무작위 → 같은 단어 중복 제거 → QUESTION_COUNT 개.
 * "직전 세션 문항 제외"는 호출부가 pool 을 걸러서 넘긴다(제외를 푸는 재시도가 필요하므로).
 */
function selectPromotionQuestions(pool: PromotionQuestion[]): PromotionQuestion[] {
  const seen = new Set<string>();
  return shuffleArray(pool)
    .filter((question) => {
      if (seen.has(question.englishWord)) return false;
      seen.add(question.englishWord);
      return true;
    })
    .slice(0, PROMOTION.QUESTION_COUNT);
}

/** 응답 문항 — isCorrect 는 절대 노출하지 않고 옵션은 응답 시점에 셔플한다(position 암기 차단). */
function toResponseQuestion(question: PromotionQuestion) {
  return {
    id: question.id,
    koreanHint: question.koreanHint,
    sentence: question.sentence,
    options: shuffleArray(question.options).map((option) => ({ text: option.text })),
  };
}

/**
 * POST /api/promotion/start
 * 세션을 생성하는 쓰기라 GET 이 아니다. 요청 body 는 읽지 않는다.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    // --- 1) 락 밖(읽기 전용): 자격 판정 ---
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { level: true },
    });
    const parsedLevel = cefrLevelSchema.safeParse(profile?.level);
    const level = parsedLevel.success ? parsedLevel.data : "A1";

    const [levelProgress, lastFailedPromotion] = await Promise.all([
      getLevelProgress(userId, level),
      prisma.levelPromotionAttempt.findFirst({
        where: { userId, passed: false },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const promotion = derivePromotionStatus(
      level,
      levelProgress,
      lastFailedPromotion?.createdAt ?? null
    );

    if (promotion.status !== "eligible") {
      return NextResponse.json(
        {
          error: "지금은 승급 시험에 응시할 수 없어요",
          reason: promotion.status,
          ...(promotion.availableAt
            ? { availableAt: promotion.availableAt.toISOString() }
            : {}),
        },
        { status: 403 }
      );
    }

    const expected = getNextLevel(level);
    if (!expected) {
      // derivePromotionStatus 가 max-level 로 이미 걸러내므로 도달 불가 — 타입 좁히기 겸 방어
      return NextResponse.json(
        { error: "이미 최고 레벨이에요", reason: "max-level" },
        { status: 403 }
      );
    }

    // --- 2) 트랜잭션 + 잠금: 조회-후-조건부-생성이라 필수 (§4-2 잠금 규약) ---
    const outcome = await prisma.$transaction(async (transaction) => {
      // start·submit 공통 키 — 키를 나누면 두 라우트가 서로 배제되지 않는다.
      const lockKey = `promotion:${userId}`;

      await transaction.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${lockKey}::text, 0)
        )::text AS "lockResult"
      `;

      const ttlCutoff = new Date(Date.now() - PROMOTION.SESSION_TTL_MINUTES * 60 * 1000);

      // (a) 유효 미소진 세션이 있으면 그대로 재사용 — 새로고침·StrictMode 이중 마운트가
      //     진행 중 응시를 무효화하지 않는다. toLevel 조건이 있어야 레벨 드리프트 후
      //     제출 불가능한 세션에 갇히지 않는다.
      const reusable = await transaction.levelPromotionSession.findFirst({
        where: {
          userId,
          consumedAt: null,
          createdAt: { gte: ttlCutoff },
          toLevel: expected,
        },
        orderBy: { createdAt: "desc" },
      });

      if (reusable) {
        const questions = await transaction.quizQuestion.findMany({
          where: { id: { in: reusable.questionIds } },
          include: QUESTION_INCLUDE,
        });
        // 발급 순서를 보존한다 — 재호출이 같은 문항을 같은 순서로 돌려주도록.
        const byId = new Map(questions.map((question) => [question.id, question]));
        const ordered = reusable.questionIds
          .map((id) => byId.get(id))
          .filter((question): question is PromotionQuestion => question !== undefined);

        return { kind: "ok" as const, sessionId: reusable.id, questions: ordered };
      }

      // (b) 새 세션 — §4-2 문항 선정 4단계
      const pool = await transaction.quizQuestion.findMany({
        where: { difficulty: expected },
        include: QUESTION_INCLUDE,
      });

      const lastSession = await transaction.levelPromotionSession.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { questionIds: true },
      });
      const excluded = new Set(lastSession?.questionIds ?? []);

      // ② 직전 세션 문항 제외 — 없으면 재응시 때 같은 10문항이 나와
      //    "어휘력"이 아니라 "그 10문항 암기"를 측정하게 된다.
      let selected = selectPromotionQuestions(
        pool.filter((question) => !excluded.has(question.id))
      );

      // ④ 제외 후 못 채우면 제외를 풀고 재시도
      if (selected.length < PROMOTION.QUESTION_COUNT) {
        selected = selectPromotionQuestions(pool);
      }

      // 그래도 부족하면 세션을 만들지 않는다(콘텐츠 부족 — 사용자 잘못이 아니다).
      if (selected.length < PROMOTION.QUESTION_COUNT) {
        return { kind: "insufficient" as const };
      }

      const created = await transaction.levelPromotionSession.create({
        data: {
          userId,
          toLevel: expected,
          questionIds: selected.map((question) => question.id),
        },
        select: { id: true },
      });

      return { kind: "ok" as const, sessionId: created.id, questions: selected };
    });

    if (outcome.kind === "insufficient") {
      return NextResponse.json(
        { error: "지금은 시험을 준비할 수 없어요" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      sessionId: outcome.sessionId,
      toLevel: expected,
      questions: outcome.questions.map(toResponseQuestion),
    });
  } catch (error) {
    console.error("Promotion start error:", error);
    return NextResponse.json(
      { error: "승급 시험을 시작하지 못했어요" },
      { status: 500 }
    );
  }
}
