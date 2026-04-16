"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { fetchDailyQuiz } from "../api/quiz-api";
import type { QuizQuestion } from "@/entities/question";

interface DailyQuizReturn {
  questions: QuizQuestion[];
  userLevel: string;
  hasCompletedToday: boolean;
  freeHintCount: number;
}

export function useDailyQuiz(): DailyQuizReturn {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.quiz.daily(),
    queryFn: () => fetchDailyQuiz(),
    gcTime: 0,        // 언마운트 시 즉시 캐시 제거
    staleTime: Infinity, // 배경 리페치 없음 — removeQueries로만 갱신
  });

  return {
    questions: data.questions,
    userLevel: data.userLevel,
    hasCompletedToday: data.hasCompletedToday,
    freeHintCount: data.freeHintCount,
  };
}
