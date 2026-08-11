/**
 * Flashcard Feature Types
 *
 * TypeScript type definitions for flashcard functionality.
 */

export type SessionMode = "review" | "new";

export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

export type ReviewQuality = "forgot" | "hard" | "normal" | "easy";

export type StudyMode =
  | SessionMode
  | "flashcard"
  | "matching"
  | "choice"
  | "typing"
  | "listening";

// Vocabulary card with user progress
export interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  audioUrl?: string;
  exampleAudioUrl?: string;
  masteryLevel: MasteryLevel;
  nextReviewDate: string;
}

// Session response from API
export interface SessionResponse {
  vocabularies: VocabularyCard[];
  mode: SessionMode;
  count: number;
}

// Single review entry
export interface ReviewEntry {
  vocabularyId: string;
  quality: ReviewQuality;
  timeSpent: number; // seconds
}

// 세션에서 사용자가 스스로 매긴 난이도 분포
export type QualityBreakdown = Record<ReviewQuality, number>;

// Review submission request
export interface ReviewRequest {
  reviews: ReviewEntry[];
  mode: StudyMode;
  duration: number; // total session duration in seconds
}

// Review result for a single vocabulary
export interface ReviewResult {
  vocabularyId: string;
  masteryLevel: MasteryLevel;
  nextReviewDate: string;
}

import type { GamificationResult } from "@/entities/gamification";

// Review submission response
export interface SubmitResponse {
  success: boolean;
  summary: {
    total: number;
    /** "잊음"이 아닌 카드 수. 채점이 아니라 사용자의 자기평가 기준이다. */
    remembered: number;
    xpEarned: number;
    breakdown: QualityBreakdown;
  };
  results: ReviewResult[];
  gamification?: GamificationResult;
}

// Session result (from review submission, stored in sessionStorage)
export interface SessionResult {
  xp: number;
  total: number;
  remembered: number;
  durationSec: number;
  /** URL fallback(새로고침) 경로에서는 전달되지 않는다. */
  breakdown?: QualityBreakdown;
  results?: ReviewResult[];
}
