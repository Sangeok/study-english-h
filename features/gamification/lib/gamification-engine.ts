import prisma from "@/lib/db";
import { POINT_EVENTS } from "../config/point-events";
import { addLeaguePoints } from "./league-points";
import { checkAchievements } from "./achievement-checker";
import { checkStreakMilestones } from "./streak-freeze";
import type { GamificationEvent, GamificationResult } from "../types";

/**
 * 학습 완료 시 게이미피케이션 보상 일괄 처리
 * 모든 DB 작업을 단일 트랜잭션으로 실행하여 원자성을 보장한다.
 * 부분 실패 시 전체 롤백되므로 리그 포인트/XP/배지 불일치가 발생하지 않는다.
 */
export async function processGamificationRewards(
  userId: string,
  event: GamificationEvent
): Promise<GamificationResult> {
  // v2: boostMultiplier 추출 — 기본값 1 (퀴즈 외 경로는 미적용)
  const multiplier = event.boostMultiplier ?? 1;

  return prisma.$transaction(async (tx) => {
    // 1. 리그 포인트 계산 및 적립
    let leaguePoints = 0;
    if (event.type === "quiz") {
      leaguePoints += event.correctCount * POINT_EVENTS.QUIZ_CORRECT;
      if (event.accuracy === 100) {
        leaguePoints += POINT_EVENTS.QUIZ_PERFECT;
      }
    }
    if (event.type === "flashcard") {
      leaguePoints += event.correctCount * POINT_EVENTS.FLASHCARD_REVIEW;
    }
    if (event.type === "diagnosis") {
      leaguePoints += POINT_EVENTS.DIAGNOSIS_COMPLETE;
    }

    const leagueResult = await addLeaguePoints(userId, leaguePoints, tx);

    // 2. 스트릭 마일스톤 체크 — boostMultiplier 전파 (v2 T3)
    const milestoneResults = await checkStreakMilestones(
      userId,
      event.currentStreak,
      tx,
      multiplier
    );

    // 3. 배지 달성 체크 — boostMultiplier 전파 (v2 T3)
    const profile = await tx.userProfile.findUnique({
      where: { userId },
      select: {
        totalWordLearned: true,
        currentStreak: true,
      },
    });

    const league = await tx.userLeague.findUnique({
      where: { userId },
      select: { tier: true },
    });

    const newAchievements = await checkAchievements(
      userId,
      {
        totalWordLearned: profile?.totalWordLearned ?? 0,
        currentStreak: event.currentStreak,
        recentAccuracy: event.accuracy,
        leagueTier: league?.tier ?? 0,
      },
      tx,
      multiplier
    );

    return {
      leaguePoints,
      promoted: leagueResult.promoted,
      newTierName: leagueResult.newTierName,
      milestones: milestoneResults,
      newAchievements,
    };
  });
}
