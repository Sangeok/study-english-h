export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserProfile {
  userId: string;
  level?: CefrLevel;
  totalXP?: number;
  lastStudyDate?: Date;
  weaknessAreas?: Record<string, number>;
}

// GET /api/profile/stats 응답 계약 — 생산자(라우트)는 satisfies로, 소비자(useProfileStats)는 제네릭으로 이 타입을 공유한다.
export interface ProfileStats {
  level: string;
  totalXP: number;
  streak: number;
  longestStreak: number;
  totalWordLearned: number;
  masteredWords: number;
  reviewNeeded: number;
  hasCompletedDiagnosis: boolean;
  weaknessAreas: Record<string, number> | null;
  vocabularyProgress: number;
  lastStudyDate: string | null;
  hasCompletedTodayQuiz: boolean;
}
