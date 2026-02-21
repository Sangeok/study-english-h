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

// Derived request/response validation types
export type ReviewEntry = z.infer<typeof reviewEntrySchema>;
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type SessionQuery = z.infer<typeof sessionQuerySchema>;

// Compile-time compatibility checks with domain types.
type Assert<T extends true> = T;
type IsSubset<T, U> = [T] extends [U] ? true : false;
export type ReviewQualitySchemaCompatible = Assert<
  IsSubset<z.infer<typeof reviewQualitySchema>, ReviewQuality>
>;
export type StudyModeSchemaCompatible = Assert<
  IsSubset<z.infer<typeof studyModeSchema>, StudyMode>
>;
