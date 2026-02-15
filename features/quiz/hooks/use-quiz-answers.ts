"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizQuestion } from "@/entities/question";
import type { QuizSubmission } from "../lib/quiz-api";

export function useQuizAnswers(questions: QuizQuestion[], currentIndex: number, isQuizSubmitted: boolean) {
  const [answers, setAnswers] = useState<Record<string, QuizSubmission>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, 0 | 1 | 2>>({});
  const startTimesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (questions.length > 0 && !isQuizSubmitted) {
      const currentQuestionId = questions[currentIndex]?.id;
      if (currentQuestionId && !startTimesRef.current[currentQuestionId]) {
        startTimesRef.current[currentQuestionId] = Date.now();
      }
    }
  }, [currentIndex, questions, isQuizSubmitted]);

  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      const startTime = startTimesRef.current[questionId] ?? Date.now();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          selectedAnswer: answer,
          timeSpent,
          hintLevel: hintLevels[questionId] ?? 0,
        },
      }));
    },
    [hintLevels]
  );

  const handleHintRequest = useCallback(() => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setHintLevels((prev) => {
      const current = prev[currentQuestion.id] ?? 0;
      const maxLevel = currentQuestion.contextHint ? 2 : 1;
      return {
        ...prev,
        [currentQuestion.id]: Math.min(current + 1, maxLevel) as 0 | 1 | 2,
      };
    });
  }, [currentIndex, questions]);

  return {
    answers,
    hintLevels,
    handleAnswer,
    handleHintRequest,
  };
}
