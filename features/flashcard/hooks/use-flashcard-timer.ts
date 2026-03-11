/**
 * Flashcard Timer Hook
 *
 * Manages session and per-card timing using refs for accuracy.
 * Initialization is triggered externally via resetSessionTimer().
 */

"use client";

import { useCallback, useRef } from "react";

export function useFlashcardTimer() {
  const sessionStartRef = useRef<number>(0);
  const cardStartRef = useRef<number>(0);

  /**
   * Start timing a new card
   */
  const startCardTimer = useCallback(() => {
    cardStartRef.current = Date.now();
  }, []);

  /**
   * Get time spent on current card in seconds
   */
  const getCardTime = useCallback((): number => {
    if (cardStartRef.current === 0) return 0;
    return Math.floor((Date.now() - cardStartRef.current) / 1000);
  }, []);

  /**
   * Get total session duration in seconds
   */
  const getSessionDuration = useCallback((): number => {
    if (sessionStartRef.current === 0) return 0;
    return Math.floor((Date.now() - sessionStartRef.current) / 1000);
  }, []);

  /**
   * Reset session timer — single initialization entry point.
   * Call this on session mount instead of relying on internal effects.
   */
  const resetSessionTimer = useCallback(() => {
    sessionStartRef.current = Date.now();
    cardStartRef.current = Date.now();
  }, []);

  return {
    startCardTimer,
    getCardTime,
    getSessionDuration,
    resetSessionTimer,
  };
}
