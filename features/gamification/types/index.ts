// 여러 feature가 공유하는 타입(GamificationResult, StreakMilestoneResult, TxClient)은
// features 간 수평 의존을 피하기 위해 entities/gamification에 정의되어 있다.
// 외부 feature는 "@/entities/gamification"에서 직접 import할 것.
export type { GamificationResult, StreakMilestoneResult, TxClient } from "@/entities/gamification";

export interface GamificationEvent {
  type: "quiz" | "flashcard" | "diagnosis";
  correctCount: number;
  totalCount: number;
  /**
   * 채점 기반 정확도. flashcard 는 채점이 없어 "잊음이 아닌 비율"이 들어오며
   * 리그 포인트·배지 판정에 쓰이지 않는다(gamification-engine 참고).
   */
  accuracy: number;
  currentStreak: number;
  boostMultiplier?: number; // 기본값 1, 퀴즈 경로만 명시 전달
}

export interface AchievementCheckContext {
  totalWordLearned: number;
  currentStreak: number;
  /**
   * 채점 기반 정확도(퀴즈·진단)만 담는다.
   * 플래시카드처럼 정답이 없고 자기평가만 하는 세션은 undefined 를 넣어
   * accuracy 계열 배지(accuracy_80, perfect_day) 판정에서 제외한다.
   */
  recentAccuracy?: number;
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
