import { apiClient } from "@/shared/lib";
import type { StreakDetailResponse, LeagueRankingEntry, AchievementResponse } from "../types";

export async function fetchStreakDetails(): Promise<StreakDetailResponse> {
  return apiClient.get<StreakDetailResponse>("/api/gamification/streak");
}

export async function fetchLeagueRanking(
  tier: number = 1,
  limit: number = 10
): Promise<{ tier: number; ranking: LeagueRankingEntry[] }> {
  return apiClient.get<{ tier: number; ranking: LeagueRankingEntry[] }>(
    `/api/gamification/league/ranking?tier=${tier}&limit=${limit}`
  );
}

export async function fetchAchievements(): Promise<{
  all: AchievementResponse[];
  totalUnlocked: number;
  totalAchievements: number;
}> {
  return apiClient.get<{
    all: AchievementResponse[];
    totalUnlocked: number;
    totalAchievements: number;
  }>("/api/gamification/achievements");
}

export async function fetchMyLeague(): Promise<{ tier: number; leaguePoints: number }> {
  return apiClient.get<{ tier: number; leaguePoints: number }>("/api/gamification/league/me");
}
