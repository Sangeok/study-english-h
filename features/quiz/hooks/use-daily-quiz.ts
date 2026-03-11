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
  });

  return {
    questions: data.questions,
    userLevel: data.userLevel,
  };
}
