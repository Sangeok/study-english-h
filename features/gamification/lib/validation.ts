import { z } from "zod";

export const leagueRankingQuerySchema = z.object({
  tier: z.coerce.number().int().min(1).max(6).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});
