"use client";

import { useCallback, useState } from "react";

export function useQuizNavigation(totalQuestions: number, onSubmit: () => void) {
  const [rawIndex, setRawIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentIndex =
    totalQuestions <= 0 || rawIndex > totalQuestions - 1 ? 0 : rawIndex;

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setRawIndex(currentIndex + 1);
        setIsTransitioning(false);
      }, 300);
      return;
    }

    if (totalQuestions > 0) {
      onSubmit();
    }
  }, [currentIndex, totalQuestions, onSubmit]);

  const goPrevious = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setRawIndex(Math.max(0, currentIndex - 1));
      setIsTransitioning(false);
    }, 300);
  }, [currentIndex]);

  return {
    currentIndex,
    isTransitioning,
    goNext,
    goPrevious,
  };
}
