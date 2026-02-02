"use client";

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
    queryFn: async () => {
      try {
        return await apiClient.get<DailyQuizResponse>("/api/quiz/daily");
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          router.push("/diagnosis?required=true");
          return null;
        }
        throw error;
      }
    },
  });

  return {
    ...query,
    questions: query.data?.questions ?? [],
    userLevel: query.data?.userLevel ?? "A1",
  };
}
