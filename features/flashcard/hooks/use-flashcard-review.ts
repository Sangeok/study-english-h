/**
 * Flashcard Review Hook
 *
 * React Query mutation hook for submitting flashcard reviews
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/shared/lib";
import { submitReviews } from "../lib/flashcard-api";
import type { ReviewRequest } from "../types";

export function useFlashcardReview() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewRequest) => submitReviews(data),
    onSuccess: (response) => {
      // Invalidate flashcard queries to refresh session data
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashcard.all,
      });

      // Store full result in sessionStorage for enhanced result page
      const resultData = {
        xp: response.summary.xpEarned,
        accuracy: response.summary.accuracy,
        total: response.summary.total,
        correct: response.summary.correct,
        results: response.results,
      };

      try {
        sessionStorage.setItem("flashcard-result", JSON.stringify(resultData));
      } catch (e) {
        console.error("Failed to store flashcard result:", e);
      }

      // Navigate to result page with basic statistics as fallback
      const params = new URLSearchParams({
        xp: String(response.summary.xpEarned),
        accuracy: String(response.summary.accuracy),
        total: String(response.summary.total),
        correct: String(response.summary.correct),
      });

      router.push(`/flashcard/result?${params.toString()}`);
    },
  });
}
