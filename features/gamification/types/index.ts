import type { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma interactive transaction client
export type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export interface GamificationEvent {
  type: "quiz" | "flashcard" | "diagnosis";
  correctCount: number;
  totalCount: number;
  accuracy: number;
  currentStreak: number;
}

export interface GamificationResult {
  leaguePoints: number;
  promoted: boolean;
  newTierName: string | null;
  milestones: StreakMilestoneResult[];
  newAchievements: string[];
}

export interface StreakMilestoneResult {
  milestone: number;
  xpReward: number;
  freezeReward: number;
}

export interface AchievementCheckContext {
  totalWordLearned: number;
  currentStreak: number;
  recentAccuracy: number;
  leagueTier: number;
}

export interface LeagueRankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  points: number;
  tier: number;
}

export interface StreakDetailResponse {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  freezeCount: number;
}

export interface AchievementResponse {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}
