"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const rawMode = searchParams.get("mode");
  // mode=new(신규 카드 진도)는 사용자 동선에서 제거됐고 URL 로만 도달한다 — 보류 상태(ADR 0002).
  // 새 단어를 만나는 경로는 데일리 퀴즈뿐이므로 기본값은 항상 복습이다.
  const mode: SessionMode = rawMode === "new" ? "new" : "review";
  const sessionLabel = mode === "review" ? "복습" : "새 단어";

  const { data, isLoading, error, refetch } = useFlashcardSession(mode);
  const reviewMutation = useFlashcardReview();
  const { startCardTimer, getCardTime, getSessionDuration, resetSessionTimer } = useFlashcardTimer();

  useEffect(() => {
    resetSessionTimer();
  }, [resetSessionTimer]);

  if (isLoading) {
    return <FlashcardLoading message={`${sessionLabel} 카드를 준비하는 중...`} />;
  }

  if (error) {
    return <FlashcardError onRetry={() => refetch()} />;
  }

  if (!data || data.vocabularies.length === 0) {
    return <FlashcardEmpty mode={mode} />;
  }

  return (
    <FlashcardGame
      sessionLabel={sessionLabel}
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
