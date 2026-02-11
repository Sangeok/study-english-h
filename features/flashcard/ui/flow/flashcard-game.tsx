"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/shared/ui";
import { FlashcardCard } from "./flashcard-card";
import { DifficultyButtons } from "./difficulty-buttons";
import { MasteryBadge } from "./mastery-badge";
import type { VocabularyCard, ReviewEntry, ReviewQuality } from "../../types";

interface FlashcardGameProps {
  cards: VocabularyCard[];
  isPending: boolean;
  onSubmitReviews: (reviews: ReviewEntry[], duration: number) => void;
  startCardTimer: () => void;
  getCardTime: () => number;
  getSessionDuration: () => number;
}

export function FlashcardGame({
  cards,
  isPending,
  onSubmitReviews,
  startCardTimer,
  getCardTime,
  getSessionDuration,
}: FlashcardGameProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  // Start card timer on mount
  useEffect(() => {
    startCardTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset card state when index changes
  useEffect(() => {
    setIsFlipped(false);
    startCardTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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
        setCurrentIndex((i) => i + 1);
      } else {
        onSubmitReviews(updatedReviews, getSessionDuration());
      }
    },
    [currentCard.id, currentIndex, cards.length, reviews, getCardTime, getSessionDuration, onSubmitReviews]
  );

  const handlePlayAudio = useCallback(() => {
    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl);
      audio.play().catch(() => toast("오디오 재생에 실패했습니다."));
    }
  }, [currentCard.audioUrl, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <FlashcardCard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={handleFlip}
        onPlayAudio={handlePlayAudio}
      />

      {isFlipped && (
        <DifficultyButtons isPending={isPending} onReview={handleReview} />
      )}

      <div className="max-w-2xl mx-auto mt-6 text-center">
        <MasteryBadge masteryLevel={currentCard.masteryLevel} />
      </div>
    </div>
  );
}
