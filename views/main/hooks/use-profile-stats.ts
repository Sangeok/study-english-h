"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, apiClient, queryKeys } from "@/shared/lib";

export interface ProfileStats {
  level: string;
  totalXP: number;
  streak: number;
  longestStreak: number;
  totalWordLearned: number;
  masteredWords: number;
  reviewNeeded: number;
  hasCompletedDiagnosis: boolean;
  weaknessAreas: Record<string, number> | null;
  vocabularyProgress: number;
  lastStudyDate: string | null;
}

async function fetchProfileStats(): Promise<ProfileStats> {
  return apiClient.get<ProfileStats>("/api/profile/stats");
}

export function useProfileStats(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.profile.stats(),
    queryFn: fetchProfileStats,
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
