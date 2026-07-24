import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateEffectiveCurrentStreak, getVocabularyStats, type ProfileStats } from "@/entities/user";
import { getTodayKSTRange } from "@/entities/user/lib/streak";
import { getSessionFromRequest } from "@/shared/lib/get-session";

// 어휘 진행률 (숙달 단어 / 전체 학습 단어). 두 응답 분기가 공유한다.
function calculateVocabularyProgress(totalWordLearned: number, masteredWords: number): number {
  return totalWordLearned > 0 ? Math.round((masteredWords / totalWordLearned) * 100) : 0;
}

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
    const [profile, diagnosisStatus, todayQuizCount, vocabStats] = await Promise.all([
      // 사용자 프로필 — select 로 어휘 3컬럼을 타입에서 제외한다.
      //   낡은 컬럼(profile.reviewNeeded 등)을 실수로 읽으면 컴파일 에러가 나도록 만드는 것이 목적이다.
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          level: true,
          totalXP: true,
          longestStreak: true,
          currentStreak: true,
          lastStudyDate: true,
          weaknessAreas: true,
        },
      }),
      // 진단 완료 여부
      prisma.levelDiagnosis.findFirst({
        where: { userId },
        orderBy: { completedAt: "desc" },
      }),
      // 오늘 퀴즈 완료 여부 (KST 기준)
      prisma.userQuizAttempt.count({
        where: { userId, attemptedAt: getTodayKSTRange() },
      }),
      // 어휘 통계 라이브 집계 (컬럼 캐시 아님 — 근거는 getVocabularyStats 주석)
      getVocabularyStats(userId),
    ]);

    // 어휘 3필드는 컬럼이 아니라 이 라이브 집계에서 온다.
    const { totalWordLearned, masteredWords, reviewNeeded } = vocabStats;

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
        totalWordLearned,
        masteredWords,
        reviewNeeded,
        hasCompletedDiagnosis: false,
        weaknessAreas: null,
        vocabularyProgress: calculateVocabularyProgress(totalWordLearned, masteredWords),
        lastStudyDate: null,
        hasCompletedTodayQuiz: todayQuizCount > 0,
      } satisfies ProfileStats);
    }

    const effectiveStreak = calculateEffectiveCurrentStreak(
      profile.lastStudyDate,
      profile.currentStreak
    );

    return NextResponse.json({
      level: profile.level,
      totalXP: profile.totalXP,
      streak: effectiveStreak,
      longestStreak: profile.longestStreak,
      totalWordLearned,
      masteredWords,
      reviewNeeded,
      hasCompletedDiagnosis: !!diagnosisStatus,
      weaknessAreas: profile.weaknessAreas as Record<string, number> | null,
      vocabularyProgress: calculateVocabularyProgress(totalWordLearned, masteredWords),
      lastStudyDate: profile.lastStudyDate?.toISOString() ?? null,
      hasCompletedTodayQuiz: todayQuizCount > 0,
    } satisfies ProfileStats);
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json({ error: "통계 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
