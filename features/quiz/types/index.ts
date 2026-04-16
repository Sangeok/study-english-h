export interface QuizSubmission {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;
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
  // (RV4) correctBaseXP 제거 — 유일 소비처가 xpPenaltyFromHints로 교체되어 고아 필드
  xpPenaltyFromHints: number; // v2 신규 — route가 pre-compute (부스트 배수 반영된 값)
  hintStats: {
    noHintCorrect: number;
    partialHintCorrect: number;
    fullHintCorrect: number;
  };
}

import type { QuizQuestion } from "@/entities/question";
import type { GamificationResult } from "@/features/gamification/types";

export interface DailyQuizResponse {
  questions: QuizQuestion[];
  userLevel: string;
  totalQuestions: number;
  hasCompletedToday: boolean;
}

export interface QuizSubmitResponse {
  results: QuizResult[];
  summary: QuizSummary;
  gamification?: GamificationResult;
  isExtraPractice: boolean;
  currentStreak: number;
}
