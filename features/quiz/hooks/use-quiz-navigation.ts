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

/**
 * initialIndex 는 복원된 세션의 진행 위치다. 저장소가 이미 문항 수에 맞춰 내보내지만
 * (quiz-session-storage 의 pruneToQuestions), clampIndex 는 이중 방어로 남긴다.
 */
export function useQuizNavigation(
  totalQuestions: number,
  onSubmit: () => void,
  initialIndex = 0
) {
  const [rawIndex, setRawIndex] = useState(initialIndex);
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

