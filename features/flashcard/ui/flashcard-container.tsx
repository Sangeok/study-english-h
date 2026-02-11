"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFlashcardSession } from "../hooks/use-flashcard-session";
import { useFlashcardReview } from "../hooks/use-flashcard-review";
import { useFlashcardTimer } from "../hooks/use-flashcard-timer";
import { FlashcardLoading } from "./status/flashcard-loading";
import { FlashcardError } from "./status/flashcard-error";
import { FlashcardEmpty } from "./status/flashcard-empty";
import { FlashcardGame } from "./flow/flashcard-game";

export function FlashcardContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") || "review") as "review" | "new";

  const { data, isLoading, error, refetch } = useFlashcardSession(mode);
  const reviewMutation = useFlashcardReview();
  const { startCardTimer, getCardTime, getSessionDuration, resetSessionTimer } = useFlashcardTimer();

  // Initialize session timer on mount
  useEffect(() => {
    resetSessionTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onSwitchMode={(m) => router.push(`/flashcard?mode=${m}`)}
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
