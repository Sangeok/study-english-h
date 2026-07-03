export const queryKeys = {
  quiz: {
    all: ["quiz"] as const,
    daily: () => [...queryKeys.quiz.all, "daily"] as const,
  },
  diagnosis: {
    all: ["diagnosis"] as const,
    start: () => [...queryKeys.diagnosis.all, "start"] as const,
    status: () => [...queryKeys.diagnosis.all, "status"] as const,
    detail: (id: string) => [...queryKeys.diagnosis.all, id] as const,
  },
  flashcard: {
    all: ["flashcard"] as const,
    session: (mode: string) => [...queryKeys.flashcard.all, "session", mode] as const,
  },
  profile: {
    all: ["profile"] as const,
    stats: () => [...queryKeys.profile.all, "stats"] as const,
    recentActivity: (limit: number) => [...queryKeys.profile.all, "recent-activity", limit] as const,
  },
  gamification: {
    all: ["gamification"] as const,
    streak: () => [...queryKeys.gamification.all, "streak"] as const,
    league: () => [...queryKeys.gamification.all, "league"] as const,
    leagueRanking: (tier: number) =>
      [...queryKeys.gamification.all, "league", "ranking", tier] as const,
    achievements: () => [...queryKeys.gamification.all, "achievements"] as const,
    myLeague: () => [...queryKeys.gamification.all, "league", "me"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    periodStats: (period: string) =>
      [...queryKeys.dashboard.all, "period-stats", period] as const,
  },
  shop: {
    all: ["shop"] as const,
    items: () => [...queryKeys.shop.all, "items"] as const,
  },
} as const;
