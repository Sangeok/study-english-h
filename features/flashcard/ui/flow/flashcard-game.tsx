"use client";

import { useCallback } from "react";
import { useToast } from "@/shared/ui";
import { useFlashcardGameFlow } from "../../hooks/use-flashcard-game-flow";
import { FlashcardCard } from "./flashcard-card";
import { FlashcardProgressBar } from "./flashcard-progress-bar";
import { DifficultyButtons } from "./difficulty-buttons";
import { MasteryBadge } from "./mastery-badge";
import type { VocabularyCard, ReviewEntry } from "../../types";

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
  const { currentIndex, isFlipped, currentCard, progress, handleFlip, handleReview } =
    useFlashcardGameFlow({ cards, onSubmitReviews, startCardTimer, getCardTime, getSessionDuration });

  const handlePlayAudio = useCallback(() => {
    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl);
      audio.play().catch(() => toast("오디오 재생에 실패했습니다."));
    }
  }, [currentCard.audioUrl, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <FlashcardProgressBar
        current={currentIndex + 1}
        total={cards.length}
        progress={progress}
      />

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
