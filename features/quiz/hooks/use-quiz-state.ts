"use client";

import { useMemo } from "react";
import type { DailyQuizItem, QuizSubmission } from "../types";

// 읽기 전용 필드에 접근하지 않는다 — currentQuestion.id 만 쓰므로 좁히기 없이 유니온을 받는다.
export function useQuizState(
  questions: DailyQuizItem[],
  currentIndex: number,
  answers: Record<string, QuizSubmission>,
  hintLevels: Record<string, 0 | 1 | 2>
) {
  const currentQuestion = questions[currentIndex];
  const currentHintLevel = (currentQuestion ? hintLevels[currentQuestion.id] : 0) ?? 0;

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const canSubmit = useMemo(
    () => questions.length > 0 && answeredCount === questions.length,
    [answeredCount, questions.length]
  );

  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;

  return {
    currentQuestion,
    currentHintLevel,
    answeredCount,
    isLastQuestion,
    isAnswered,
    canSubmit,
  };
}
