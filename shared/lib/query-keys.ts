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
} as const;
