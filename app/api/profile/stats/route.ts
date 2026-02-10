import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";

/**
 * GET /api/profile/stats
 * 메인 페이지용 사용자 프로필 통계 조회
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    // 병렬로 필요한 데이터 조회
    const [profile, diagnosisStatus] = await Promise.all([
      // 사용자 프로필
      prisma.userProfile.findUnique({
        where: { userId },
      }),
      // 진단 완료 여부
      prisma.levelDiagnosis.findFirst({
        where: { userId },
        orderBy: { completedAt: "desc" },
      }),
    ]);

    // 프로필이 없으면 기본값 생성
    if (!profile) {
      const newProfile = await prisma.userProfile.create({
        data: {
          userId,
          level: "A1",
          totalXP: 0,
        },
      });

      return NextResponse.json({
        level: newProfile.level,
        totalXP: 0,
        streak: 0,
        longestStreak: 0,
        totalWordLearned: 0,
        masteredWords: 0,
        reviewNeeded: 0,
        hasCompletedDiagnosis: false,
        weaknessAreas: null,
        vocabularyProgress: 0,
      });
    }

    // 어휘 진행률 계산 (숙달 단어 / 전체 학습 단어)
    const vocabularyProgress =
      profile.totalWordLearned > 0 ? Math.round((profile.masteredWords / profile.totalWordLearned) * 100) : 0;

    return NextResponse.json({
      level: profile.level,
      totalXP: profile.totalXP,
      streak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      totalWordLearned: profile.totalWordLearned,
      masteredWords: profile.masteredWords,
      reviewNeeded: profile.reviewNeeded,
      hasCompletedDiagnosis: !!diagnosisStatus,
      weaknessAreas: profile.weaknessAreas,
      vocabularyProgress,
      lastStudyDate: profile.lastStudyDate,
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json({ error: "통계 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
