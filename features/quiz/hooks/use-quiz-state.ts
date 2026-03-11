"use client";

import { useMemo } from "react";
import type { QuizQuestion } from "@/entities/question";
import type { QuizSubmission } from "../types";

export function useQuizState(
  questions: QuizQuestion[],
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
