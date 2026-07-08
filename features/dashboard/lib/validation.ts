import { z } from "zod";

export const dashboardPeriodSchema = z.object({
  period: z.enum(["day", "week", "month", "all"]).default("week"),
});
