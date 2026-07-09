"use client";

import { useCallback } from "react";
import { useToast } from "@/shared/ui";
import { useFlashcardGameFlow } from "../../hooks/use-flashcard-game-flow";
import { playAudio } from "../../lib/play-audio";
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

  const handlePlayWord = useCallback(() => {
    const played = playAudio(currentCard.word, currentCard.audioUrl);
    if (!played) {
      toast("이 브라우저에서는 발음 재생을 지원하지 않아요.");
    }
  }, [currentCard.word, currentCard.audioUrl, toast]);

  const handlePlayExample = useCallback(() => {
    if (!currentCard.exampleSentence) return;
    const played = playAudio(currentCard.exampleSentence, currentCard.exampleAudioUrl);
    if (!played) {
      toast("이 브라우저에서는 발음 재생을 지원하지 않아요.");
    }
  }, [currentCard.exampleSentence, currentCard.exampleAudioUrl, toast]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-chamber px-4 py-8">
      <div className="relative">
        <FlashcardProgressBar
          current={currentIndex + 1}
          total={cards.length}
          progress={progress}
        />

        <FlashcardCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          onPlayWord={handlePlayWord}
          onPlayExample={handlePlayExample}
        />

        {isFlipped && (
          <DifficultyButtons isPending={isPending} onReview={handleReview} />
        )}

        <div className="mx-auto mt-6 max-w-2xl text-center">
          <MasteryBadge masteryLevel={currentCard.masteryLevel} />
        </div>
      </div>
    </div>
  );
}
