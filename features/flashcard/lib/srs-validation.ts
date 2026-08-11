/**
 * Zod Validation Schemas for SRS API
 *
 * Request/response validation for flashcard endpoints.
 */

import { z } from "zod";
import type { ReviewQuality, StudyMode } from "../types";

export const reviewQualitySchema = z.enum(["forgot", "hard", "normal", "easy"]);

export const studyModeSchema = z.enum([
  "review",
  "new",
  "flashcard",
  "matching",
  "choice",
  "typing",
  "listening",
]);

export const reviewEntrySchema = z.object({
  vocabularyId: z.string().min(1, "Vocabulary ID is required"),
  quality: reviewQualitySchema,
  /**
   * 받기만 하고 **서버가 무시한다** — 플래시카드에는 채점이 없어 quality 에서 파생하는
   * 값이며, 파생은 서버가 한다(app/api/flashcard/review/route.ts).
   * 클라이언트가 더 이상 보내지 않게 되면 이 필드를 제거할 것.
   */
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0, "Time spent must be non-negative"),
});

export const reviewRequestSchema = z.object({
  reviews: z
    .array(reviewEntrySchema)
    .min(1, "At least one review is required")
    .max(100, "Maximum 100 reviews per submission"),
  mode: studyModeSchema,
  duration: z.number().int().min(0, "Duration must be non-negative"),
});

export const sessionQuerySchema = z.object({
  mode: z.enum(["review", "new"]).default("review"),
  limit: z.number().int().min(1).max(50).default(20),
});

// Compile-time compatibility checks with domain types.
type Assert<T extends true> = T;
type IsSubset<T, U> = [T] extends [U] ? true : false;
export type ReviewQualitySchemaCompatible = Assert<
  IsSubset<z.infer<typeof reviewQualitySchema>, ReviewQuality>
>;
export type StudyModeSchemaCompatible = Assert<
  IsSubset<z.infer<typeof studyModeSchema>, StudyMode>
>;
