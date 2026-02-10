import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { BASE_XP_PER_QUESTION, calculateQuestionXP, type QuizResult } from "@/features/quiz/lib";
import { getSessionFromRequest } from "@/shared/lib";
import { getStreakUpdateData } from "@/shared/lib/update-streak";

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

    // 힌트 통계 초기화
    let totalXP = 0;
    let correctBaseXP = 0;
    const hintStats = {
      noHintCorrect: 0,
      partialHintCorrect: 0,
      fullHintCorrect: 0,
    };

    // 모든 문제를 한 번에 조회
    const questionIds = Array.from(new Set(answers.map((answer) => answer.questionId)));
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    const results: QuizResult[] = [];
    const attemptData = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        continue;
      }

      const correctOption = question.options.find((opt) => opt.isCorrect);
      const isCorrect = correctOption?.text === answer.selectedAnswer;

      if (isCorrect) {
        const earnedXP = calculateQuestionXP(true, answer.hintLevel);
        totalXP += earnedXP;
        correctBaseXP += BASE_XP_PER_QUESTION;

        if (answer.hintLevel === 0) {
          hintStats.noHintCorrect++;
        } else if (answer.hintLevel === 1) {
          hintStats.partialHintCorrect++;
        } else if (answer.hintLevel === 2) {
          hintStats.fullHintCorrect++;
        }
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

    if (attemptData.length > 0) {
      await prisma.userQuizAttempt.createMany({
        data: attemptData,
      });
    }

    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

    // UserProfile upsert (XP 적립, 학습일, streak 업데이트)
    const streakData = await getStreakUpdateData(userId);

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        totalXP: totalXP,
        lastStudyDate: streakData.lastStudyDate,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      },
      update: {
        totalXP: { increment: totalXP },
        lastStudyDate: streakData.lastStudyDate,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      },
    });

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
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json({ error: "퀴즈 제출 중 오류가 발생했습니다" }, { status: 500 });
  }
}
