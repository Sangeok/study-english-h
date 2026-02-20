"use client";

import { useCallback, useState } from "react";
import { QUIZ_TRANSITION_DURATION_MS } from "../config";

function clampIndex(rawIndex: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0;
  }

  if (rawIndex > totalQuestions - 1) {
    return 0;
  }

  return rawIndex;
}

export function useQuizNavigation(totalQuestions: number, onSubmit: () => void) {
  const [rawIndex, setRawIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentIndex = clampIndex(rawIndex, totalQuestions);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setRawIndex((prev) => prev + 1);
        setIsTransitioning(false);
      }, QUIZ_TRANSITION_DURATION_MS);
      return;
    }

    if (totalQuestions > 0) {
      onSubmit();
    }
  }, [currentIndex, onSubmit, totalQuestions]);

  const goPrevious = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setRawIndex((prev) => Math.max(0, prev - 1));
      setIsTransitioning(false);
    }, QUIZ_TRANSITION_DURATION_MS);
  }, []);

  return {
    currentIndex,
    isTransitioning,
    goNext,
    goPrevious,
  };
}

