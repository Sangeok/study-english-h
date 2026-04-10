import type { StreakDetailResponse, LeagueRankingEntry, AchievementResponse } from "../types";

export async function fetchStreakDetails(): Promise<StreakDetailResponse> {
  const res = await fetch("/api/gamification/streak");
  if (!res.ok) throw new Error("Failed to fetch streak details");
  return res.json();
}

export async function fetchLeagueRanking(
  tier: number = 1,
  limit: number = 10
): Promise<{ tier: number; ranking: LeagueRankingEntry[] }> {
  const res = await fetch(`/api/gamification/league/ranking?tier=${tier}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch league ranking");
  return res.json();
}

export async function fetchAchievements(): Promise<{
  all: AchievementResponse[];
  totalUnlocked: number;
  totalAchievements: number;
}> {
  const res = await fetch("/api/gamification/achievements");
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

export async function fetchMyLeague(): Promise<{ tier: number; leaguePoints: number }> {
  const res = await fetch("/api/gamification/league/me");
  if (!res.ok) throw new Error("Failed to fetch my league");
  return res.json();
}
