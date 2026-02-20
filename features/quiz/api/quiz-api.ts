import type { QuizQuestion } from "@/entities/question";
import { apiClient } from "@/shared/lib";
import type { QuizSubmission, QuizSubmitResponse } from "../types";

interface DailyQuizResponse {
  questions: QuizQuestion[];
  userLevel: string;
  totalQuestions: number;
}

export async function fetchDailyQuiz(count = 10): Promise<DailyQuizResponse> {
  return apiClient.get<DailyQuizResponse>(`/api/quiz/daily?count=${count}`);
}

export async function submitQuiz(answers: QuizSubmission[]): Promise<QuizSubmitResponse> {
  return apiClient.post<QuizSubmitResponse>("/api/quiz/submit", { answers });
}

