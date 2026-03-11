"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FLASHCARD_ROUTES } from "../config";
import { useFlashcardSession } from "../hooks/use-flashcard-session";
import { useFlashcardReview } from "../hooks/use-flashcard-review";
import { useFlashcardTimer } from "../hooks/use-flashcard-timer";
import type { SessionMode } from "../types";
import { FlashcardLoading } from "./status/flashcard-loading";
import { FlashcardError } from "./status/flashcard-error";
import { FlashcardEmpty } from "./status/flashcard-empty";
import { FlashcardGame } from "./flow/flashcard-game";

export function FlashcardContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawMode = searchParams.get("mode");
  const mode: SessionMode = rawMode === "new" ? "new" : "review";

  const { data, isLoading, error, refetch } = useFlashcardSession(mode);
  const reviewMutation = useFlashcardReview();
  const { startCardTimer, getCardTime, getSessionDuration, resetSessionTimer } = useFlashcardTimer();

  useEffect(() => {
    resetSessionTimer();
  }, [resetSessionTimer]);

  if (isLoading) {
    return <FlashcardLoading message="플래시카드를 준비하는 중..." />;
  }

  if (error) {
    return <FlashcardError onRetry={() => refetch()} />;
  }

  if (!data || data.vocabularies.length === 0) {
    return (
      <FlashcardEmpty
        mode={mode}
        onSwitchMode={(m) => router.push(`${FLASHCARD_ROUTES.session}?mode=${m}`)}
      />
    );
  }

  return (
    <FlashcardGame
      cards={data.vocabularies}
      isPending={reviewMutation.isPending}
      onSubmitReviews={(reviews, duration) =>
        reviewMutation.mutate({ reviews, mode: "flashcard", duration })
      }
      startCardTimer={startCardTimer}
      getCardTime={getCardTime}
      getSessionDuration={getSessionDuration}
    />
  );
}
