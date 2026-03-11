"use client";

import { useCallback, useState } from "react";
import type { VocabularyCard, ReviewEntry, ReviewQuality } from "../types";

interface UseFlashcardGameFlowParams {
  cards: VocabularyCard[];
  onSubmitReviews: (reviews: ReviewEntry[], duration: number) => void;
  startCardTimer: () => void;
  getCardTime: () => number;
  getSessionDuration: () => number;
}

export function useFlashcardGameFlow({
  cards,
  onSubmitReviews,
  startCardTimer,
  getCardTime,
  getSessionDuration,
}: UseFlashcardGameFlowParams) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleReview = useCallback(
    (quality: ReviewQuality) => {
      const timeSpent = getCardTime();
      const review: ReviewEntry = {
        vocabularyId: currentCard.id,
        quality,
        isCorrect: quality !== "forgot",
        timeSpent,
      };

      const updatedReviews = [...reviews, review];

      if (currentIndex < cards.length - 1) {
        setReviews(updatedReviews);
        setIsFlipped(false);
        startCardTimer();
        setCurrentIndex((i) => i + 1);
      } else {
        onSubmitReviews(updatedReviews, getSessionDuration());
      }
    },
    [currentCard.id, currentIndex, cards.length, reviews, getCardTime, getSessionDuration, onSubmitReviews, startCardTimer]
  );

  return {
    currentIndex,
    isFlipped,
    currentCard,
    progress,
    handleFlip,
    handleReview,
  };
}
