"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/entities/question";
import { apiClient, ApiError, queryKeys } from "@/shared/lib";

interface DailyQuizResponse {
  questions: QuizQuestion[];
  userLevel: string;
  totalQuestions: number;
}

export function useDailyQuiz() {
  const router = useRouter();

  const query = useQuery({
    queryKey: queryKeys.quiz.daily(),
    queryFn: () => apiClient.get<DailyQuizResponse>("/api/quiz/daily"),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) {
        return false;
      }

      return failureCount < 3;
    },
  });

  const isDiagnosisRequired =
    query.error instanceof ApiError && query.error.status === 403;

  useEffect(() => {
    if (isDiagnosisRequired) {
      router.replace("/diagnosis?required=true");
    }
  }, [isDiagnosisRequired, router]);

  return {
    ...query,
    isDiagnosisRequired,
    questions: query.data?.questions ?? [],
    userLevel: query.data?.userLevel ?? "A1",
  };
}
