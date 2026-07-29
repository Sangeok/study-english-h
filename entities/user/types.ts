import type { CefrLevel } from "@/shared/constants";
// 유니온을 인라인 재정의하지 말고 단일 출처를 import 한다 — 생산자(derivePromotionStatus)의
// 반환 유니온과 응답 계약이 조용히 드리프트하는 것을 막는다. lib 는 prisma 무의존 순수 모듈이다.
import type { PromotionStatus } from "./lib/level-progress";

export type { CefrLevel };

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
  /** P4: 현재 레벨 준비도 0-100 (산식: shared/constants/level-progress.ts) */
  levelProgress: number;
  promotionStatus: PromotionStatus;
  /** cooldown 일 때만 — 재응시 가능 시각 ISO */
  promotionAvailableAt: string | null;
}
