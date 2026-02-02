export const queryKeys = {
  quiz: {
    all: ["quiz"] as const,
    daily: () => [...queryKeys.quiz.all, "daily"] as const,
  },
  diagnosis: {
    all: ["diagnosis"] as const,
    start: () => [...queryKeys.diagnosis.all, "start"] as const,
    detail: (id: string) => [...queryKeys.diagnosis.all, id] as const,
  },
} as const;
