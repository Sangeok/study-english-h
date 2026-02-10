/**
 * use-profile-stats.ts
 * 사용자 프로필 통계 조회 Hook
 */

import { useQuery } from "@tanstack/react-query";

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
  const response = await fetch("/api/profile/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch profile stats");
  }

  return response.json();
}

export function useProfileStats() {
  return useQuery({
    queryKey: ["profile", "stats"],
    queryFn: fetchProfileStats,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 1,
  });
}
