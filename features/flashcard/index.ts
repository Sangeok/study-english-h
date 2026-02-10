/**
 * Flashcard Feature - Public API
 *
 * Barrel export for flashcard feature slice
 */

// Types
export type {
  VocabularyCard,
  SessionResponse,
  ReviewQuality,
  ReviewEntry,
  ReviewRequest,
  ReviewResult,
  SubmitResponse,
  StudyMode,
} from "./types";

// API Client
export { fetchFlashcardSession, submitReviews } from "./lib/flashcard-api";

// Hooks
export { useFlashcardSession } from "./hooks/use-flashcard-session";
export { useFlashcardReview } from "./hooks/use-flashcard-review";
export { useFlashcardTimer } from "./hooks/use-flashcard-timer";
