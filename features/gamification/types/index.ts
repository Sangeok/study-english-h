// 여러 feature가 공유하는 타입(GamificationResult, StreakMilestoneResult, TxClient)은
// features 간 수평 의존을 피하기 위해 entities/gamification에 정의되어 있다.
// 외부 feature는 "@/entities/gamification"에서 직접 import할 것.
export type { GamificationResult, StreakMilestoneResult, TxClient } from "@/entities/gamification";

export interface GamificationEvent {
  type: "quiz" | "flashcard" | "diagnosis";
  correctCount: number;
  totalCount: number;
  accuracy: number;
  currentStreak: number;
  boostMultiplier?: number; // 기본값 1, 퀴즈 경로만 명시 전달
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
