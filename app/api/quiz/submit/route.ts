import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  BASE_XP_PER_QUESTION,
  calculateQuestionXP,
  type QuizResult,
  type QuizSubmission,
  type QuizSubmitResponse,
} from "@/features/quiz/lib";
import { getStreakUpdateData } from "@/entities/user";
import { getTodayKSTRange } from "@/entities/user/lib/streak";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { POINT_EVENTS } from "@/features/gamification/config/point-events";
import { selectFreeHintTargets } from "@/features/shop/lib/select-free-hint-targets";
import { QUIZ_BOOST_MULTIPLIER } from "@/features/shop/config/shop-items";
import { isPrismaCheckConstraintError } from "@/features/shop/lib/prisma-errors";

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

    // --- 트랜잭션 이전: 문제 조회 + streak 계산 (읽기 전용) ---

    const questionIds = Array.from(new Set(answers.map((answer) => answer.questionId)));
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    // 유효 questionId가 최소 1개 있어야 한다.
    //   answers.length > 0만으로는 bogus questionId 제출이 bonus XP + 충전 소비를 트리거한다.
    const hasValidAnswer = answers.some((a) => questionMap.has(a.questionId));
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
      const hintedAnswers: { questionId: string; hintLevel: 0 | 1 | 2; isCorrect: boolean }[] = [];
      for (const answer of answers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;
        const correctOption = question.options.find((opt) => opt.isCorrect);
        const isCorrect = correctOption?.text === answer.selectedAnswer;

        hintedAnswers.push({
          questionId: answer.questionId,
          hintLevel: answer.hintLevel,
          isCorrect,
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
          timeSpent: answer.timeSpent,
          hintLevel: answer.hintLevel, // attempt에는 실제 힌트 레벨 기록 (분석용)
        });

        results.push({
          questionId: answer.questionId,
          isCorrect,
          correctAnswer: correctOption?.text,
          explanation: question.sentence,
        });
      }

      // Set 기반 프리 힌트 대상 선정 — isExtraPractice 시 소비 안 함
      const freeHintTargets = selectFreeHintTargets(
        hintedAnswers,
        isExtraPractice ? 0 : availableFreeHints
      );
      const freeHintsUsed = freeHintTargets.size;

      // 부스트 충전 소비 여부 — XP 계산 전에 결정, isExtraPractice 시 소비 안 함
      const shouldConsumeBoostCharge = !isExtraPractice && availableCharges > 0;
      const boostMultiplier = shouldConsumeBoostCharge ? QUIZ_BOOST_MULTIPLIER : 1;

      // XP 계산 (effectiveHintLevel 사용, 부스트는 마지막에 일괄 적용)
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

      // 응답용 집계 (부스트 반영된 값)
      totalXP = finalXP;
      // xpPenaltyFromHints: 부스트 반영된 기본 XP - 실제 지급 XP
      //   tx 내부에서 계산 후 return으로 반출 (outer let 불필요)
      const xpPenaltyFromHints = boostedCorrectBaseXP - boostedPerQuestionXP;

      return { isExtraPractice, boostMultiplier, xpPenaltyFromHints };
    });

    // --- 트랜잭션 이후: 게임화 보상 + 응답 ---

    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

    let gamificationResult;
    if (!txResult.isExtraPractice) {
      // boostMultiplier 전파 — 퀴즈 트리거 스트릭 마일스톤/업적 XP도 동일 배수 적용
      gamificationResult = await processGamificationRewards(userId, {
        type: "quiz",
        correctCount,
        totalCount: results.length,
        accuracy,
        currentStreak: streakData.currentStreak,
        boostMultiplier: txResult.boostMultiplier,
      });
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        correct: correctCount,
        accuracy: Math.round(accuracy),
        xpEarned: totalXP,
        xpPenaltyFromHints: txResult.xpPenaltyFromHints,
        hintStats,
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
