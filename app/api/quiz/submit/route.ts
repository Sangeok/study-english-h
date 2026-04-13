import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { BASE_XP_PER_QUESTION, calculateQuestionXP, type QuizResult } from "@/features/quiz/lib";
import { getStreakUpdateData } from "@/entities/user";
import { getTodayKSTRange } from "@/entities/user/lib/streak";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { POINT_EVENTS } from "@/features/gamification/config/point-events";

interface QuizSubmission {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;
    const { answers } = (await req.json()) as { answers: QuizSubmission[] };

    // --- 트랜잭션 이전: 문제 조회 + streak 계산 (읽기 전용) ---

    const questionIds = Array.from(new Set(answers.map((answer) => answer.questionId)));
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    // getStreakUpdateData는 내부적으로 prisma를 직접 사용하므로 트랜잭션 외부에서 호출한다.
    const streakData = await getStreakUpdateData(userId);

    // --- 트랜잭션 진입: count → 결과 계산 → createMany → upsert 원자성 보장 ---

    let totalXP = 0;
    let correctBaseXP = 0;
    const hintStats = { noHintCorrect: 0, partialHintCorrect: 0, fullHintCorrect: 0 };
    const results: QuizResult[] = [];
    const attemptData: Prisma.UserQuizAttemptCreateManyInput[] = [];

    const txResult = await prisma.$transaction(async (tx) => {
      const todayAttemptCount = await tx.userQuizAttempt.count({
        where: { userId, attemptedAt: getTodayKSTRange() },
      });
      const isExtraPractice = todayAttemptCount > 0;

      for (const answer of answers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;

        const correctOption = question.options.find((opt) => opt.isCorrect);
        const isCorrect = correctOption?.text === answer.selectedAnswer;

        if (isCorrect && !isExtraPractice) {
          const earnedXP = calculateQuestionXP(true, answer.hintLevel);
          totalXP += earnedXP;
          correctBaseXP += BASE_XP_PER_QUESTION;
        }

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
          hintLevel: answer.hintLevel,
        });

        results.push({
          questionId: answer.questionId,
          isCorrect,
          correctAnswer: correctOption?.text,
          explanation: question.sentence,
        });
      }

      // 첫 완료 보너스: DAILY_GOAL_COMPLETE + DAILY_STREAK
      if (!isExtraPractice) {
        totalXP += POINT_EVENTS.DAILY_GOAL_COMPLETE;
        if (streakData.currentStreak > 1) {
          totalXP += POINT_EVENTS.DAILY_STREAK;
        }
      }

      if (attemptData.length > 0) {
        await tx.userQuizAttempt.createMany({ data: attemptData });
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          totalXP: isExtraPractice ? 0 : totalXP,
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
        update: {
          ...(isExtraPractice ? {} : { totalXP: { increment: totalXP } }),
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
      });

      return { isExtraPractice };
    });

    // --- 트랜잭션 이후: 게임화 보상 + 응답 ---

    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

    let gamificationResult;
    if (!txResult.isExtraPractice) {
      gamificationResult = await processGamificationRewards(userId, {
        type: "quiz",
        correctCount,
        totalCount: results.length,
        accuracy,
        currentStreak: streakData.currentStreak,
      });
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        correct: correctCount,
        accuracy: Math.round(accuracy),
        xpEarned: totalXP,
        correctBaseXP,
        hintStats,
      },
      gamification: gamificationResult,
      isExtraPractice: txResult.isExtraPractice,
      currentStreak: streakData.currentStreak,
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json({ error: "퀴즈 제출 중 오류가 발생했습니다" }, { status: 500 });
  }
}
