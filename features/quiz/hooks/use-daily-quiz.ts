"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { fetchDailyQuiz } from "../api/quiz-api";
import type { QuizQuestion } from "@/entities/question";

interface DailyQuizReturn {
  questions: QuizQuestion[];
  userLevel: string;
}

export function useDailyQuiz(): DailyQuizReturn {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.quiz.daily(),
    queryFn: () => fetchDailyQuiz(),
    gcTime: 0, // 언마운트 시 즉시 캐시 제거 → 재방문 시 항상 fresh fetch
  });

  return {
    questions: data.questions,
    userLevel: data.userLevel,
  };
}
