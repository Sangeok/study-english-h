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
  SessionResult,
} from "./types";

// API Client
export { fetchFlashcardSession, submitReviews } from "./lib/flashcard-api";

// Hooks
export { useFlashcardSession } from "./hooks/use-flashcard-session";
export { useFlashcardReview } from "./hooks/use-flashcard-review";
export { useFlashcardTimer } from "./hooks/use-flashcard-timer";

// UI Components
export { FlashcardContainer } from "./ui/flashcard-container";
export { FlashcardLoading } from "./ui/status/flashcard-loading";
export { SessionResultContent } from "./ui/result/session-result";
