"use client";

import { useCallback, useRef } from "react";

export function useQuizTimer() {
  const startTimesRef = useRef<Record<string, number>>({});

  const startTimer = useCallback((questionId: string) => {
    if (!startTimesRef.current[questionId]) {
      startTimesRef.current[questionId] = Date.now();
    }
  }, []);

  const getElapsedSeconds = useCallback((questionId: string): number => {
    const startTime = startTimesRef.current[questionId] ?? Date.now();
    return Math.floor((Date.now() - startTime) / 1000);
  }, []);

  return { startTimer, getElapsedSeconds };
}
