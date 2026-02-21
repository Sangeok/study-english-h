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
  isCorrect: boolean;
  timeSpent: number; // seconds
}

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

// Review submission response
export interface SubmitResponse {
  success: boolean;
  summary: {
    total: number;
    correct: number;
    accuracy: number;
    xpEarned: number;
  };
  results: ReviewResult[];
}

// Session result (from review submission, stored in sessionStorage)
export interface SessionResult {
  xp: number;
  accuracy: number;
  total: number;
  correct: number;
  results?: ReviewResult[];
}
