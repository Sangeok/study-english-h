"use client";

import { hasFlashcardQualityCounts } from "../lib/flashcard-utils";
import type { FlashcardActivity } from "../model";
import {
  formatRelativeDate,
  type RelativeDateReference,
} from "../lib/format-relative-date";

interface FlashcardActivityCardProps {
  activity: FlashcardActivity;
  dateReference: RelativeDateReference;
}

export function FlashcardActivityCard({
  activity,
  dateReference,
}: FlashcardActivityCardProps) {
  const minutes = Math.max(0, Math.floor(activity.duration / 60));
  const { qualityCounts } = activity;
  const hasQualityCounts = hasFlashcardQualityCounts(qualityCounts);

  return (
    <article
      className="tactile-card tactile-card--interactive p-4"
      aria-label="플래시카드 학습 활동"
    >
      <div className="flex items-center gap-4">
        <div className="tactile-tile h-12 w-12 shrink-0 border-ocean bg-ocean-tint text-2xl">
          <span aria-hidden="true">🃏</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="font-display font-bold text-ink">플래시카드</h4>
            <span className="text-xs text-ink-soft">
              {formatRelativeDate(activity.date, dateReference)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="font-display font-bold text-ink">
              {activity.vocabularyCount}
              <span className="ml-0.5 font-sans text-sm font-normal text-ink-soft">개 단어</span>
            </span>
            <span>{minutes}분 학습</span>
          </div>
          {hasQualityCounts && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {qualityCounts.easy > 0 && (
                <span className="tactile-chip border-teal bg-teal-tint text-ink">
                  😊 {qualityCounts.easy}
                </span>
              )}
              {qualityCounts.normal > 0 && (
                <span className="tactile-chip border-ocean bg-ocean-tint text-ink">
                  ✓ {qualityCounts.normal}
                </span>
              )}
              {qualityCounts.hard > 0 && (
                <span className="tactile-chip border-gold bg-gold-tint text-ink">
                  😓 {qualityCounts.hard}
                </span>
              )}
              {qualityCounts.forgot > 0 && (
                <span className="tactile-chip border-coral bg-coral-tint text-ink">
                  ✗ {qualityCounts.forgot}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
