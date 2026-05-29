"use client";

import { cn } from "@/lib/utils";
import { ACCURACY_LABELS, ACCURACY_STYLES } from "../config/accuracy-config";
import {
  getAccuracyLevel,
  getAverageSeconds,
  getQuizAccuracy,
} from "../lib/accuracy-utils";
import type { QuizActivity } from "../model";
import {
  formatRelativeDate,
  type RelativeDateReference,
} from "../lib/format-relative-date";

interface QuizActivityCardProps {
  activity: QuizActivity;
  dateReference: RelativeDateReference;
}

export function QuizActivityCard({ activity, dateReference }: QuizActivityCardProps) {
  const accuracy = getQuizAccuracy(activity.correctAnswers, activity.totalQuestions);
  const averageSeconds = getAverageSeconds(activity.totalTime, activity.totalQuestions);
  const accuracyLevel = getAccuracyLevel(accuracy);

  return (
    <article
      className="tactile-card tactile-card--interactive p-4"
      aria-label="퀴즈 학습 활동"
    >
      <div className="flex items-center gap-4">
        <div className="tactile-tile h-12 w-12 shrink-0 border-teal bg-teal-tint text-2xl">
          <span aria-hidden="true">🎮</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="font-display font-bold text-ink">일일 퀴즈</h4>
            <span className="text-xs text-ink-soft">
              {formatRelativeDate(activity.date, dateReference)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <span>
              {activity.correctAnswers}/{activity.totalQuestions}문제
            </span>
            <span className="font-display font-bold text-ink">{accuracy}% 정확도</span>
            <span>평균 {averageSeconds}초</span>
          </div>
        </div>
        <div className={cn("tactile-chip", ACCURACY_STYLES[accuracyLevel])}>
          {ACCURACY_LABELS[accuracyLevel]}
        </div>
      </div>
    </article>
  );
}
