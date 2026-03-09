"use client";

import type { FlashcardActivity } from "@/shared/lib";
import { hasFlashcardQualityCounts } from "../lib/flashcard-utils";
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
      className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 hover:shadow-md transition-all duration-300"
      aria-label="플래시카드 학습 활동"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" aria-hidden="true">🃏</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-purple-950">플래시카드</h4>
            <span className="text-xs text-purple-600">
              {formatRelativeDate(activity.date, dateReference)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-purple-700">
            <span>{activity.vocabularyCount}개 단어</span>
            <span>{minutes}분 학습</span>
          </div>
          {hasQualityCounts && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {qualityCounts.easy > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  😊 {qualityCounts.easy}
                </span>
              )}
              {qualityCounts.normal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  ✓ {qualityCounts.normal}
                </span>
              )}
              {qualityCounts.hard > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  😓 {qualityCounts.hard}
                </span>
              )}
              {qualityCounts.forgot > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
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
