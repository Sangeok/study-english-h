import { z } from "zod";

export const streakFreezeSchema = z.object({
  count: z.number().int().min(1).max(10).optional().default(1),
});

export const leagueRankingQuerySchema = z.object({
  tier: z.coerce.number().int().min(1).max(6).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type StreakFreezeInput = z.infer<typeof streakFreezeSchema>;
export type LeagueRankingQuery = z.infer<typeof leagueRankingQuerySchema>;
