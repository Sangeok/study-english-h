"use client";

import { useCallback, useEffect, useState } from "react";

export function useQuizNavigation(totalQuestions: number, onSubmit: () => void) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (totalQuestions === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > totalQuestions - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalQuestions]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
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
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsTransitioning(false);
    }, 300);
  }, []);

  return {
    currentIndex,
    isTransitioning,
    goNext,
    goPrevious,
  };
}
