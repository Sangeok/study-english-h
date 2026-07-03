import type { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma interactive transaction client
export type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export interface StreakMilestoneResult {
  milestone: number;
  xpReward: number;
  freezeReward: number;
}

export interface GamificationResult {
  leaguePoints: number;
  promoted: boolean;
  newTierName: string | null;
  milestones: StreakMilestoneResult[];
  newAchievements: string[];
}
