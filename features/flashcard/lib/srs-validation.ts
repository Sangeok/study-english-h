/**
 * Zod Validation Schemas for SRS API
 *
 * Request/response validation for flashcard endpoints
 */

import { z } from "zod";

// Review quality enum
export const reviewQualitySchema = z.enum(["forgot", "hard", "normal", "easy"]);

// Study mode enum
export const studyModeSchema = z.enum(["review", "new", "flashcard", "matching", "choice", "typing", "listening"]);

// Single review entry schema
export const reviewEntrySchema = z.object({
  vocabularyId: z.string().min(1, "Vocabulary ID is required"),
  quality: reviewQualitySchema,
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0, "Time spent must be non-negative"),
});

// Review submission request schema
export const reviewRequestSchema = z.object({
  reviews: z
    .array(reviewEntrySchema)
    .min(1, "At least one review is required")
    .max(100, "Maximum 100 reviews per submission"),
  mode: studyModeSchema,
  duration: z.number().int().min(0, "Duration must be non-negative"),
});

// Session query parameters schema
export const sessionQuerySchema = z.object({
  mode: z.enum(["review", "new"]).default("review"),
  limit: z.number().int().min(1).max(50).default(20),
});

// Types derived from schemas
export type ReviewQuality = z.infer<typeof reviewQualitySchema>;
export type StudyMode = z.infer<typeof studyModeSchema>;
export type ReviewEntry = z.infer<typeof reviewEntrySchema>;
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type SessionQuery = z.infer<typeof sessionQuerySchema>;
