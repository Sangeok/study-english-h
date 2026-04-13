import { apiClient } from "@/shared/lib";
import type { DailyQuizResponse, QuizSubmission, QuizSubmitResponse } from "../types";

export async function fetchDailyQuiz(count = 10): Promise<DailyQuizResponse> {
  return apiClient.get<DailyQuizResponse>(`/api/quiz/daily?count=${count}`);
}

export async function submitQuiz(answers: QuizSubmission[]): Promise<QuizSubmitResponse> {
  return apiClient.post<QuizSubmitResponse>("/api/quiz/submit", { answers });
}

