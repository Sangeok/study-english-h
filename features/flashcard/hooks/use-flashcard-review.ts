/**
 * Flashcard Review Hook
 *
 * React Query mutation hook for submitting flashcard reviews
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/shared/lib";
import { useToast } from "@/shared/ui";
import { submitReviews } from "../api/flashcard-api";
import { FLASHCARD_ROUTES, FLASHCARD_STORAGE_KEYS } from "../config";
import type { ReviewRequest } from "../types";

export function useFlashcardReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        sessionStorage.setItem(
          FLASHCARD_STORAGE_KEYS.result,
          JSON.stringify(resultData)
        );
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

      router.push(`${FLASHCARD_ROUTES.result}?${params.toString()}`);
    },
    onError: () => {
      toast("결과 저장에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.", {
        variant: "error",
      });
    },
  });
}
