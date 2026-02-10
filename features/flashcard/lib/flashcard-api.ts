/**
 * Flashcard API Client
 *
 * Functions for interacting with flashcard endpoints
 */

import { apiClient } from "@/shared/lib";
import type { SessionResponse, ReviewRequest, SubmitResponse } from "../types";

/**
 * Fetch flashcard session data
 *
 * @param mode - "review" for due cards, "new" for unlearned cards
 * @param limit - Maximum number of cards to fetch
 * @returns Session data with vocabulary cards
 */
export async function fetchFlashcardSession(
  mode: "review" | "new",
  limit: number = 20
): Promise<SessionResponse> {
  return apiClient.get<SessionResponse>(
    `/api/flashcard/session?mode=${mode}&limit=${limit}`
  );
}

/**
 * Submit flashcard review results
 *
 * @param data - Review data including all card reviews
 * @returns Submission result with statistics
 */
export async function submitReviews(
  data: ReviewRequest
): Promise<SubmitResponse> {
  return apiClient.post<SubmitResponse>("/api/flashcard/review", data);
}
