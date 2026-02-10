/**
 * use-recent-activity.ts
 * 최근 학습 활동 조회 Hook
 */

import { useQuery } from "@tanstack/react-query";

export interface QuizActivity {
  date: string;
  type: "quiz";
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
}

export interface QualityCounts {
  easy: number;
  normal: number;
  hard: number;
  forgot: number;
}

export interface FlashcardActivity {
  date: string;
  type: "flashcard";
  mode: string;
  vocabularyCount: number;
  duration: number;
  qualityCounts: QualityCounts;
}

export type Activity = QuizActivity | FlashcardActivity;

export interface RecentActivityResponse {
  activities: Activity[];
  totalActivities: number;
}

async function fetchRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
  const response = await fetch(`/api/profile/recent-activity?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recent activity");
  }

  return response.json();
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ["profile", "recent-activity", limit],
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 1,
  });
}
