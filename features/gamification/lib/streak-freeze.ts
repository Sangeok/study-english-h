import prisma from "@/lib/db";
import { STREAK_MILESTONES } from "../config/streak-milestones";
import type { StreakMilestoneResult, TxClient } from "../types";

/**
 * 스트릭 보호권 지급
 */
export async function grantStreakFreeze(
  userId: string,
  count: number = 1,
  tx: TxClient = prisma
) {
  await tx.userProfile.update({
    where: { userId },
    data: { freezeCount: { increment: count } },
  });
}

/**
 * 스트릭 마일스톤 체크 및 보상 지급
 * lastMilestoneGranted 이후의 미지급 마일스톤을 모두 처리한다.
 * (freeze 사용 등으로 중간 마일스톤을 건너뛴 경우에도 소급 지급)
 */
export async function checkStreakMilestones(
  userId: string,
  currentStreak: number,
  tx: TxClient = prisma,
  boostMultiplier: number = 1 // v2 신규 — 퀴즈 트리거 시 부스트 배수 전파
): Promise<StreakMilestoneResult[]> {
  const profile = await tx.userProfile.findUnique({
    where: { userId },
    select: { lastMilestoneGranted: true },
  });

  const lastGranted = profile?.lastMilestoneGranted ?? 0;

  // 아직 지급되지 않은 마일스톤 중 currentStreak 이하인 것 모두 수집
  const pendingMilestones = STREAK_MILESTONES.filter(
    (m) => m.days > lastGranted && m.days <= currentStreak
  );

  if (pendingMilestones.length === 0) return [];

  let totalXP = 0;
  let totalFreeze = 0;

  for (const milestone of pendingMilestones) {
    // (RV1) Math.floor 적용 — quiz 본체와 동일 불변식.
    //   v3에서 1.5x 같은 분수 배수 도입 시 totalXP(Int) 무결성 보장.
    totalXP += Math.floor(milestone.xpReward * boostMultiplier);
    totalFreeze += milestone.freezeReward;
  }

  // results도 배수 반영하여 결과 화면에 정확한 XP 표시 (RV1 동일 가드)
  const results: StreakMilestoneResult[] = pendingMilestones.map((m) => ({
    milestone: m.days,
    xpReward: Math.floor(m.xpReward * boostMultiplier),
    freezeReward: m.freezeReward,
  }));

  const highestGranted = pendingMilestones[pendingMilestones.length - 1].days;

  // 단일 UPDATE로 XP + freeze + lastMilestoneGranted 갱신
  await tx.userProfile.update({
    where: { userId },
    data: {
      totalXP: { increment: totalXP },
      spendableXP: { increment: totalXP },
      freezeCount: { increment: totalFreeze },
      lastMilestoneGranted: highestGranted,
    },
  });

  return results;
}
