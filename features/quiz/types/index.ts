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
  sentenceAudioUrl?: string;
}

export interface QuizSummary {
  total: number;
  correct: number;
  accuracy: number;
  xpEarned: number;
  xpPenaltyFromHints: number; // route가 pre-compute (부스트 배수 반영된 값)
  hintStats: {
    noHintCorrect: number;
    partialHintCorrect: number;
    fullHintCorrect: number;
  };
}

import type { QuizQuestion } from "@/entities/question";
import type { GamificationResult } from "@/entities/gamification";

export interface DailyQuizResponse {
  questions: QuizQuestion[];
  userLevel: string;
  totalQuestions: number;
  hasCompletedToday: boolean;
  // 서버가 내려주는 UserProfile.freeHintCount 스냅샷.
  // hasCompletedToday=true(추가 연습) 시에는 0으로 강제됨 — 이 경우 XP 미적립.
  freeHintCount: number;
}

export interface QuizSubmitResponse {
  results: QuizResult[];
  summary: QuizSummary;
  gamification?: GamificationResult;
  isExtraPractice: boolean;
  currentStreak: number;
}
