import prisma from "@/lib/db";
import { ACHIEVEMENTS } from "../config/achievements";
import type { AchievementCheckContext, TxClient } from "../types";

/**
 * 배지 달성 체크 — seed된 Achievement 레코드를 기반으로 동작
 * XP를 누적 후 한 번에 업데이트하여 race condition을 방지한다.
 * unique constraint 위반(동시 요청)은 catch하여 무시한다.
 */
export async function checkAchievements(
  userId: string,
  context: AchievementCheckContext,
  tx: TxClient = prisma
) {
  const unlockedCodes = new Set(
    (
      await tx.userAchievement.findMany({
        where: { userId },
        include: { achievement: { select: { code: true } } },
      })
    ).map((ua) => ua.achievement.code)
  );

  const newlyUnlocked: string[] = [];
  let totalXPToAdd = 0;

  for (const def of ACHIEVEMENTS) {
    if (unlockedCodes.has(def.code)) continue;

    const shouldUnlock = evaluateAchievement(def, context);
    if (!shouldUnlock) continue;

    const achievement = await tx.achievement.findUnique({
      where: { code: def.code },
    });
    if (!achievement) continue;

    // @@unique([userId, achievementId]) 위반 시 (동시 요청) 무시
    try {
      await tx.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      totalXPToAdd += def.xpReward;
      newlyUnlocked.push(def.code);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) continue;
      throw error;
    }
  }

  // XP 일괄 적용 (단일 UPDATE로 race condition 방지)
  if (totalXPToAdd > 0) {
    await tx.userProfile.update({
      where: { userId },
      data: { totalXP: { increment: totalXPToAdd } },
    });
  }

  return newlyUnlocked;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

function evaluateAchievement(
  def: (typeof ACHIEVEMENTS)[number],
  ctx: AchievementCheckContext
): boolean {
  switch (def.category) {
    case "learning":
      return ctx.totalWordLearned >= def.requirement;
    case "streak":
      return ctx.currentStreak >= def.requirement;
    case "accuracy":
      return ctx.recentAccuracy >= def.requirement;
    case "league":
      return ctx.leagueTier >= def.requirement;
    case "special":
      return false; // 수동 지급만 허용
    default:
      return false;
  }
}
