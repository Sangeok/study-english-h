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
import { useRewardToast } from "@/features/gamification";
import { submitReviews } from "../api/flashcard-api";
import { FLASHCARD_ROUTES, FLASHCARD_STORAGE_KEYS } from "../config";
import type { ReviewRequest } from "../types";

export function useFlashcardReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { showRewards } = useRewardToast();

  return useMutation({
    mutationFn: (data: ReviewRequest) => submitReviews(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashcard.all,
      });

      // 1) 보상 토스트 직접 발사 (sessionStorage/URL fallback에 의존하지 않음)
      if (response.gamification) {
        showRewards(response.gamification);
      }

      // 2) 결과 화면 표시 데이터 저장 (gamification은 결과 화면이 소비하지 않으므로 제외)
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

      const params = new URLSearchParams({
        xp: String(response.summary.xpEarned),
        accuracy: String(response.summary.accuracy),
        total: String(response.summary.total),
        correct: String(response.summary.correct),
      });

      router.push(`${FLASHCARD_ROUTES.result}?${params.toString()}`);
    },
    // 기존 에러 핸들러 유지 — 제출 실패 시 사용자에게 토스트 알림
    onError: () => {
      toast("결과 저장에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.", {
        variant: "error",
      });
    },
  });
}
