"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizQuestion } from "@/entities/question";
import type { QuizSubmission } from "../types";
import { getMaxHintLevel } from "../lib/quiz-hint-logic";
import { useQuizTimer } from "./use-quiz-timer";

const STORAGE_KEY = "quiz-answers-in-progress";

function loadFromStorage(): Record<string, QuizSubmission> {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, QuizSubmission>) : {};
  } catch {
    return {};
  }
}

export function useQuizAnswers(
  questions: QuizQuestion[],
  currentIndex: number,
  isQuizSubmitted: boolean
) {
  const [answers, setAnswers] = useState<Record<string, QuizSubmission>>(loadFromStorage);
  const [hintLevels, setHintLevels] = useState<Record<string, 0 | 1 | 2>>({});
  const { startTimer, getElapsedSeconds } = useQuizTimer();

  useEffect(() => {
    if (questions.length > 0 && !isQuizSubmitted) {
      const currentQuestionId = questions[currentIndex]?.id;
      if (currentQuestionId) {
        startTimer(currentQuestionId);
      }
    }
  }, [currentIndex, questions, isQuizSubmitted, startTimer]);

  useEffect(() => {
    if (isQuizSubmitted) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // sessionStorage 사용 불가 환경(시크릿 모드 할당량 초과 등) 무시
    }
  }, [answers, isQuizSubmitted]);

  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      const timeSpent = getElapsedSeconds(questionId);
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
    [hintLevels, getElapsedSeconds]
  );

  const handleHintRequest = useCallback(() => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setHintLevels((prev) => {
      const current = prev[currentQuestion.id] ?? 0;
      const maxLevel = getMaxHintLevel(currentQuestion.contextHint);
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
