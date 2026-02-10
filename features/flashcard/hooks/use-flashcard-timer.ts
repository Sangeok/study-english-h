/**
 * Flashcard Timer Hook
 *
 * Manages session and per-card timing using refs for accuracy
 */

"use client";

import { useRef } from "react";

export function useFlashcardTimer() {
  const sessionStartRef = useRef<number>(Date.now());
  const cardStartRef = useRef<number>(Date.now());

  /**
   * Start timing a new card
   */
  const startCardTimer = () => {
    cardStartRef.current = Date.now();
  };

  /**
   * Get time spent on current card in seconds
   */
  const getCardTime = (): number => {
    const elapsed = Date.now() - cardStartRef.current;
    return Math.floor(elapsed / 1000);
  };

  /**
   * Get total session duration in seconds
   */
  const getSessionDuration = (): number => {
    const elapsed = Date.now() - sessionStartRef.current;
    return Math.floor(elapsed / 1000);
  };

  /**
   * Reset session timer (called when starting new session)
   */
  const resetSessionTimer = () => {
    sessionStartRef.current = Date.now();
    cardStartRef.current = Date.now();
  };

  return {
    startCardTimer,
    getCardTime,
    getSessionDuration,
    resetSessionTimer,
  };
}
