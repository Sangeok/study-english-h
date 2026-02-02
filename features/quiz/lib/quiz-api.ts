import type { QuizQuestion } from "@/entities/question";
import { apiClient } from "@/shared/lib";

export type { QuizQuestion } from "@/entities/question";

export interface QuizSubmission {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;      // 신규: 사용한 최대 힌트 단계
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation: string;
}

export interface QuizSummary {
  total: number;
  correct: number;
  accuracy: number;
  xpEarned: number;
  correctBaseXP: number;     // 신규: 정답 문제만의 힌트 미사용 시 최대 XP
  hintStats: {               // 신규: 힌트 사용 통계
    noHintCorrect: number;
    partialHintCorrect: number;
    fullHintCorrect: number;
  };
}

export interface QuizSubmitResponse {
  results: QuizResult[];
  summary: QuizSummary;
}

// 일일 퀴즈 가져오기
export async function fetchDailyQuiz(count: number = 10): Promise<{
  questions: QuizQuestion[];
  userLevel: string;
  totalQuestions: number;
}> {
  return apiClient.get<{
    questions: QuizQuestion[];
    userLevel: string;
    totalQuestions: number;
  }>(`/api/quiz/daily?count=${count}`);
}

// 퀴즈 제출
export async function submitQuiz(answers: QuizSubmission[]): Promise<QuizSubmitResponse> {
  return apiClient.post<QuizSubmitResponse>("/api/quiz/submit", { answers });
}
