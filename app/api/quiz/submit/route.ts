import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { BASE_XP_PER_QUESTION } from "@/features/quiz/config/quiz-xp-config";
import { calculateQuestionXP } from "@/features/quiz/lib/quiz-xp";
import {
  normalizeQuizSubmissions,
  splitSubmissions,
} from "@/features/quiz/lib/normalize-quiz-item";
import type { QuizResult, QuizSubmission, QuizSubmitResponse } from "@/features/quiz/types";
import { getStreakUpdateData } from "@/entities/user";
import { getTodayKSTRange } from "@/entities/user/lib/streak";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { POINT_EVENTS } from "@/features/gamification/config/point-events";
import { selectFreeHintTargets } from "@/features/shop/lib/select-free-hint-targets";
import { QUIZ_BOOST_MULTIPLIER } from "@/features/shop/config/shop-items";
import { isPrismaCheckConstraintError } from "@/features/shop/lib/prisma-errors";
import {
  enrollWordsToSrs,
  type QuizWordOutcome,
} from "@/features/flashcard/lib/srs-enrollment";

/**
 * 문항당 timeSpent 상한(초). 클라이언트 자기 신고값이고, QuizSession.durationSec 이 이것을
 * 합산해 Int 컬럼에 넣는다 — 개별 값이 Int 범위 안이어도 합이 넘칠 수 있고, 넘치면
 * QuizSession.create 가 던져 트랜잭션 전체가 롤백된다(그 사용자는 계속 500 을 받는다).
 * 한 문항에 1시간을 넘길 일은 없다.
 */
const MAX_TIME_SPENT_SEC = 3600;

function clampTimeSpent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), MAX_TIME_SPENT_SEC);
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;
    const { answers } = (await req.json()) as { answers: QuizSubmission[] };

    // 빈 제출 차단 — answers=[]가 DAILY_GOAL_COMPLETE(100 XP) 지급 + 충전/힌트 소비를 트리거하지 않도록 한다.
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "제출된 답변이 없습니다" },
        { status: 400 }
      );
    }

    // 판별자 정규화 → 유형 분리. questionIds 수집보다 **먼저** 와야 한다 —
    //   유니온에서는 좁히기 전에 .questionId 에 접근할 수 없다.
    const { reading: readingAnswers, listening: listeningAnswers } = splitSubmissions(
      normalizeQuizSubmissions(answers)
    );

    // --- 트랜잭션 이전: 문제 조회 + 단어 재조회 + streak 계산 (읽기 전용) ---

    const questionIds = Array.from(new Set(readingAnswers.map((answer) => answer.questionId)));
    const vocabularyIds = Array.from(
      new Set(listeningAnswers.map((answer) => answer.vocabularyId))
    );

    const [questions, vocabularies] = await Promise.all([
      prisma.quizQuestion.findMany({
        where: { id: { in: questionIds } },
        include: { options: true },
      }),
      // 리스닝 채점은 서버 재조회다 — 클라이언트가 보낸 뜻을 믿지 않는다.
      //   순수 읽기라 트랜잭션 안에 둘 이유가 없고, 안에 두면 테스트의 트랜잭션 목까지 넓어진다.
      vocabularyIds.length > 0
        ? prisma.vocabulary.findMany({
            where: { id: { in: vocabularyIds } },
            select: { id: true, word: true, meaning: true },
          })
        : Promise.resolve([]),
    ]);

    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const vocabularyMap = new Map(vocabularies.map((vocabulary) => [vocabulary.id, vocabulary]));

    // 유효 questionId가 최소 1개 있어야 한다.
    //   answers.length > 0만으로는 bogus questionId 제출이 bonus XP + 충전 소비를 트리거한다.
    //   리스닝만으로는 통과시키지 않는다 — 데일리 완료 판정이 UserQuizAttempt 에 의존하므로
    //   읽기 0건 세션은 어차피 "오늘 미완료" 로 남는다(§4-5 count-1 클램프의 전제).
    const hasValidAnswer = readingAnswers.some((a) => questionMap.has(a.questionId));
    if (!hasValidAnswer) {
      return NextResponse.json(
        { error: "유효한 문제가 없습니다" },
        { status: 400 }
      );
    }

    // getStreakUpdateData는 내부적으로 prisma를 직접 사용하므로 트랜잭션 외부에서 호출한다.
    const streakData = await getStreakUpdateData(userId);

    // --- 트랜잭션 진입: count → 결과 계산 → createMany → upsert 원자성 보장 ---

    let totalXP = 0;
    const hintStats = { noHintCorrect: 0, partialHintCorrect: 0, fullHintCorrect: 0 };
    const results: QuizResult[] = [];
    const attemptData: Prisma.UserQuizAttemptCreateManyInput[] = [];
    // 퀴즈에서 만난 단어 전부를 편입 후보로 모은다 — 정답 여부·힌트 사용은
    // 편입 여부가 아니라 첫 복습 시점을 가른다(ADR 0002).
    // 리스닝 단어도 같은 배열에 합류한다 — 편입 호출은 1회다.
    const quizWordOutcomes: QuizWordOutcome[] = [];
    let listeningGraded = 0;
    let listeningCorrect = 0;
    let durationSec = 0;

    const txResult = await prisma.$transaction(async (tx) => {
      const todayAttemptCount = await tx.userQuizAttempt.count({
        where: { userId, attemptedAt: getTodayKSTRange() },
      });
      const isExtraPractice = todayAttemptCount > 0;

      // v2: 프로필 선조회 (프리 힌트 잔량 + 부스트 충전 잔량)
      const profileState = await tx.userProfile.findUnique({
        where: { userId },
        select: { freeHintCount: true, xpBoostCharges: true },
      });
      const availableFreeHints = profileState?.freeHintCount ?? 0;
      const availableCharges = profileState?.xpBoostCharges ?? 0;

      // 정오답 판정 + attempt/result 수집 (XP 계산 전)
      //   hintedAnswers 는 두 유형이 함께 들어간다 — XP·프리 힌트가 한 배열에서 계산된다.
      //   리스닝은 questionId 자리에 vocabularyId 를 넣는다(둘 다 cuid 라 키 충돌이 없다).
      const hintedAnswers: {
        questionId: string;
        hintLevel: 0 | 1 | 2;
        isCorrect: boolean;
        autoDegraded: boolean;
      }[] = [];

      for (const answer of readingAnswers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;
        const correctOption = question.options.find((opt) => opt.isCorrect);
        const isCorrect = correctOption?.text === answer.selectedAnswer;
        const timeSpent = clampTimeSpent(answer.timeSpent);
        durationSec += timeSpent;

        // 추가 연습 여부와 무관하게 수집 — 편입은 보상이 아니라 학습 신호다.
        // 힌트 2단계는 한국어 뜻을 공개하므로, 힌트를 쓴 정답은 확신도가 낮게 다뤄진다.
        quizWordOutcomes.push({
          word: question.englishWord,
          isCorrect,
          usedHint: answer.hintLevel > 0,
        });

        hintedAnswers.push({
          questionId: answer.questionId,
          hintLevel: answer.hintLevel,
          isCorrect,
          autoDegraded: false,
        });

        if (isCorrect) {
          if (answer.hintLevel === 0) hintStats.noHintCorrect++;
          else if (answer.hintLevel === 1) hintStats.partialHintCorrect++;
          else if (answer.hintLevel === 2) hintStats.fullHintCorrect++;
        }

        attemptData.push({
          userId,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          timeSpent,
          hintLevel: answer.hintLevel, // attempt에는 실제 힌트 레벨 기록 (분석용)
        });

        results.push({
          questionId: answer.questionId,
          isCorrect,
          correctAnswer: correctOption?.text,
          explanation: question.sentence,
          sentenceAudioUrl: question.sentenceAudioUrl ?? undefined,
        });
      }

      // 리스닝 — UserQuizAttempt 를 만들지 않는다(questionId 가 QuizQuestion 에 대한 non-nullable FK).
      //   따라서 results[] 에도 들어가지 않고, 결과 화면은 유형별 집계로만 표시한다.
      for (const answer of listeningAnswers) {
        const vocabulary = vocabularyMap.get(answer.vocabularyId);
        if (!vocabulary) continue;
        const isCorrect = vocabulary.meaning === answer.selectedMeaning;
        const timeSpent = clampTimeSpent(answer.timeSpent);
        durationSec += timeSpent;

        listeningGraded++;
        if (isCorrect) listeningCorrect++;

        quizWordOutcomes.push({
          word: vocabulary.word,
          isCorrect,
          usedHint: answer.hintLevel > 0,
        });

        hintedAnswers.push({
          questionId: answer.vocabularyId,
          hintLevel: answer.hintLevel,
          isCorrect,
          autoDegraded: answer.autoDegraded === true,
        });

        if (isCorrect) {
          if (answer.hintLevel === 0) hintStats.noHintCorrect++;
          else if (answer.hintLevel === 1) hintStats.partialHintCorrect++;
          else if (answer.hintLevel === 2) hintStats.fullHintCorrect++;
        }
      }

      // Set 기반 프리 힌트 대상 선정 — isExtraPractice 시 소비 안 함.
      //   자동 강등(재생 실패)은 후보에서 뺀다: 정렬이 hintLevel 내림차순이라 강등(레벨 2)이
      //   사용자가 직접 고른 힌트(레벨 1)를 앞지르고, 구매한 아이템이 네트워크 실패에 쓰인다.
      const freeHintTargets = selectFreeHintTargets(
        hintedAnswers.filter((h) => !h.autoDegraded),
        isExtraPractice ? 0 : availableFreeHints
      );
      const freeHintsUsed = freeHintTargets.size;

      // 부스트 충전 소비 여부 — XP 계산 전에 결정, isExtraPractice 시 소비 안 함
      const shouldConsumeBoostCharge = !isExtraPractice && availableCharges > 0;
      const boostMultiplier = shouldConsumeBoostCharge ? QUIZ_BOOST_MULTIPLIER : 1;

      // XP 계산 (effectiveHintLevel 사용, 부스트는 마지막에 일괄 적용).
      //   두 유형이 한 배열에 있으므로 합산은 1회다 — 별도 엔드포인트로 나누면 중복 지급이 된다.
      let perQuestionXP = 0;
      let correctBaseXP = 0;
      for (const h of hintedAnswers) {
        if (h.isCorrect && !isExtraPractice) {
          const effective = freeHintTargets.has(h.questionId) ? 0 : h.hintLevel;
          perQuestionXP += calculateQuestionXP(true, effective);
          correctBaseXP += BASE_XP_PER_QUESTION;
        }
      }

      // 첫 완료 보너스
      let bonusXP = 0;
      if (!isExtraPractice) {
        bonusXP += POINT_EVENTS.DAILY_GOAL_COMPLETE;
        if (streakData.currentStreak > 1) bonusXP += POINT_EVENTS.DAILY_STREAK;
      }

      // correctBaseXP는 tx 내부 국소 변수로만 사용 — 응답 계약에는 포함되지 않는다.
      // Math.floor: 현재 multiplier=2.0은 정수 결과를 보장하지만
      //   v3에서 1.5x 같은 분수 배수 도입 시 Int 컬럼 무결성을 선제 보장한다.
      const boostedPerQuestionXP = Math.floor(perQuestionXP * boostMultiplier);
      const boostedBonusXP = Math.floor(bonusXP * boostMultiplier);
      const boostedCorrectBaseXP = Math.floor(correctBaseXP * boostMultiplier);
      const finalXP = isExtraPractice ? 0 : boostedPerQuestionXP + boostedBonusXP;

      if (attemptData.length > 0) {
        await tx.userQuizAttempt.createMany({ data: attemptData });
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          totalXP: finalXP,
          spendableXP: finalXP,
          freeHintCount: Math.max(0, availableFreeHints - freeHintsUsed),
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
        update: {
          ...(isExtraPractice
            ? {}
            : {
                totalXP: { increment: finalXP },
                spendableXP: { increment: finalXP },
              }),
          ...(freeHintsUsed > 0 ? { freeHintCount: { decrement: freeHintsUsed } } : {}),
          ...(shouldConsumeBoostCharge ? { xpBoostCharges: { decrement: 1 } } : {}),
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
      });

      // 세션 기록 — 리스닝은 UserQuizAttempt 에 없으므로 유형별 관측 지점은 여기뿐이다.
      //   FlashcardSession 이 XP upsert 와 같은 트랜잭션에 있는 것과 같은 배치다.
      await tx.quizSession.create({
        data: {
          userId,
          readingCount: results.length,
          readingCorrect: results.filter((r) => r.isCorrect).length,
          listeningCount: listeningGraded,
          listeningCorrect,
          durationSec,
        },
      });

      // 응답용 집계 (부스트 반영된 값)
      totalXP = finalXP;
      // xpPenaltyFromHints: 부스트 반영된 기본 XP - 실제 지급 XP
      //   tx 내부에서 계산 후 return으로 반출 (outer let 불필요)
      const xpPenaltyFromHints = boostedCorrectBaseXP - boostedPerQuestionXP;

      return { isExtraPractice, boostMultiplier, xpPenaltyFromHints };
    });

    // --- 트랜잭션 이후: 퀴즈 편입 → 게임화 보상 → 응답 ---

    // 화면 숫자·리그 포인트·배지 판정은 전부 **읽기+듣기 합계** 기준이다.
    //   results 는 읽기 행만 담으므로 여기서 파생시키면 자동으로 "읽기 7문항 기준"이 되고,
    //   accuracy === 100 을 보는 퍼펙트 보너스와 accuracy 배지(perfect_day·accuracy_80)가
    //   리스닝 오답을 못 본 채 열린다. 배지·리그 티어는 회수 경로가 없다.
    const readingGraded = results.length;
    const readingCorrect = results.filter((r) => r.isCorrect).length;
    const gradedTotal = readingGraded + listeningGraded;
    const correctCount = readingCorrect + listeningCorrect;
    const accuracy = gradedTotal > 0 ? (correctCount / gradedTotal) * 100 : 0;

    // 퀴즈 편입 — best-effort. 실패 시 null 이 그대로 summary.srs 가 된다.
    //   게이미피케이션보다 먼저 실행한다: enrollWordsToSrs 는 자체 try/catch 로 비-throw(진짜 best-effort)지만
    //   processGamificationRewards 는 실패 격리가 없어(내부 $transaction 이 던지면 그대로 전파) 뒤에 두면
    //   게이미피케이션 실패가 편입까지 스킵시킨다. 순서를 당겨 편입을 게이미피케이션 성공에서 분리한다.
    const srs = await enrollWordsToSrs(userId, quizWordOutcomes);

    let gamificationResult;
    if (!txResult.isExtraPractice) {
      // boostMultiplier 전파 — 퀴즈 트리거 스트릭 마일스톤/업적 XP도 동일 배수 적용
      gamificationResult = await processGamificationRewards(userId, {
        type: "quiz",
        correctCount,
        totalCount: gradedTotal,
        accuracy,
        currentStreak: streakData.currentStreak,
        boostMultiplier: txResult.boostMultiplier,
      });
    }

    return NextResponse.json({
      results,
      summary: {
        total: gradedTotal,
        correct: correctCount,
        accuracy: Math.round(accuracy),
        xpEarned: totalXP,
        xpPenaltyFromHints: txResult.xpPenaltyFromHints,
        hintStats,
        listeningCount: listeningGraded,
        listeningCorrect,
        srs,
      },
      gamification: gamificationResult,
      isExtraPractice: txResult.isExtraPractice,
      currentStreak: streakData.currentStreak,
    } satisfies QuizSubmitResponse);
  } catch (error) {
    // CHECK 제약 위반 — 동시 퀴즈 제출로 인한 충전/힌트 잔량 음수화 시도.
    //   500→400 매핑 필수.
    if (isPrismaCheckConstraintError(error)) {
      return NextResponse.json(
        { error: "중복 제출 또는 동시성 충돌로 퀴즈를 다시 시도해 주세요", code: "CONCURRENT_SUBMIT" },
        { status: 400 }
      );
    }
    console.error("Quiz submit error:", error);
    return NextResponse.json({ error: "퀴즈 제출 중 오류가 발생했습니다" }, { status: 500 });
  }
}
