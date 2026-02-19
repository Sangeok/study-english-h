"use client";

import { cn } from "@/lib/utils";
import type { QuizActivity } from "@/shared/lib";
import { ACCURACY_LABELS, ACCURACY_STYLES } from "../config/accuracy-config";
import {
  getAccuracyLevel,
  getAverageSeconds,
  getQuizAccuracy,
} from "../lib/accuracy-utils";
import { formatDate } from "../lib/format-date";

interface QuizActivityCardProps {
  activity: QuizActivity;
}

export function QuizActivityCard({ activity }: QuizActivityCardProps) {
  const accuracy = getQuizAccuracy(activity.correctAnswers, activity.totalQuestions);
  const averageSeconds = getAverageSeconds(activity.totalTime, activity.totalQuestions);
  const accuracyLevel = getAccuracyLevel(accuracy);

  return (
    <article
      className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200 hover:shadow-md transition-all duration-300"
      aria-label="퀴즈 학습 활동"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" aria-hidden="true">🎮</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-purple-950">일일 퀴즈</h4>
            <span className="text-xs text-purple-600">{formatDate(activity.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-purple-700">
            <span>
              {activity.correctAnswers}/{activity.totalQuestions}문제
            </span>
            <span className="font-semibold text-purple-800">{accuracy}% 정확도</span>
            <span>평균 {averageSeconds}초</span>
          </div>
        </div>
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            ACCURACY_STYLES[accuracyLevel]
          )}
        >
          {ACCURACY_LABELS[accuracyLevel]}
        </div>
      </div>
    </article>
  );
}
