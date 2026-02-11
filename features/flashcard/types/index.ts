/**
 * Flashcard Feature Types
 *
 * TypeScript type definitions for flashcard functionality
 */

// Vocabulary card with user progress
export interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  audioUrl?: string;
  masteryLevel: "new" | "learning" | "reviewing" | "mastered";
  nextReviewDate: string;
}

// Session response from API
export interface SessionResponse {
  vocabularies: VocabularyCard[];
  mode: "review" | "new";
  count: number;
}

// Review quality ratings
export type ReviewQuality = "forgot" | "hard" | "normal" | "easy";

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
  mode: string;
  duration: number; // total session duration in seconds
}

// Review result for a single vocabulary
export interface ReviewResult {
  vocabularyId: string;
  masteryLevel: string;
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

// Study mode types
export type StudyMode = "flashcard" | "matching" | "choice" | "typing" | "listening";

// Session result (from review submission, stored in sessionStorage)
export interface SessionResult {
  xp: number;
  accuracy: number;
  total: number;
  correct: number;
  results?: ReviewResult[];
}
