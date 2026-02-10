import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";

/**
 * GET /api/profile/recent-activity
 * 최근 학습 활동 조회 (퀴즈, 플래시카드)
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // 병렬로 최근 활동 조회
    const [recentQuizzes, recentFlashcards] = await Promise.all([
      // 최근 퀴즈 시도 (일자별 그룹화)
      prisma.userQuizAttempt.findMany({
        where: { userId },
        select: {
          attemptedAt: true,
          isCorrect: true,
          timeSpent: true,
          question: {
            select: {
              category: true,
              difficulty: true,
            },
          },
        },
        orderBy: { attemptedAt: "desc" },
        take: limit * 10, // 충분한 데이터 가져오기
      }),
      // 최근 플래시카드 세션
      prisma.flashcardSession.findMany({
        where: { userId },
        select: {
          createdAt: true,
          mode: true,
          vocabularyCount: true,
          duration: true,
          easyCount: true,
          normalCount: true,
          hardCount: true,
          forgotCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    // 퀴즈 시도를 날짜별로 그룹화
    const quizByDate = recentQuizzes.reduce((acc, attempt) => {
      const date = attempt.attemptedAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          type: "quiz" as const,
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
        };
      }
      acc[date].totalQuestions++;
      if (attempt.isCorrect) acc[date].correctAnswers++;
      acc[date].totalTime += attempt.timeSpent;
      return acc;
    }, {} as Record<string, any>);

    // 플래시카드 세션 변환
    const flashcardActivities = recentFlashcards.map((session) => ({
      date: session.createdAt.toISOString().split("T")[0],
      type: "flashcard" as const,
      mode: session.mode,
      vocabularyCount: session.vocabularyCount,
      duration: session.duration,
      qualityCounts: {
        easy: session.easyCount,
        normal: session.normalCount,
        hard: session.hardCount,
        forgot: session.forgotCount,
      },
    }));

    // 퀴즈와 플래시카드 활동 합치고 날짜순 정렬
    const allActivities = [...Object.values(quizByDate), ...flashcardActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return NextResponse.json({
      activities: allActivities,
      totalActivities: allActivities.length,
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    return NextResponse.json({ error: "활동 기록 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
