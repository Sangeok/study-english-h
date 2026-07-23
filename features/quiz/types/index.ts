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
  // 오답 편입 결과. null = 편입 실패(부분 편입 후 실패 포함), enrolledCount 0 = 편입 대상 없음.
  // features/flashcard 타입을 import 하지 않도록 구조를 인라인으로 둔다(동일 레이어 의존 회피).
  // SrsEnrollmentResult(features/flashcard/lib/srs-enrollment.ts)와 구조를 반드시 함께 바꾼다.
  srs: { enrolledCount: number } | null;
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
