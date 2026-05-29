"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getActivityKey } from "../lib/activity-key";
import { useRecentActivity, type Activity } from "../model";
import {
  createRelativeDateReference,
  type RelativeDateReference,
} from "../lib/format-relative-date";
import { FlashcardActivityCard } from "./flashcard-activity-card";
import { QuizActivityCard } from "./quiz-activity-card";
import { RecentActivitySkeleton } from "./recent-activity-skeleton";

interface RecentActivityProps {
  className?: string;
  limit?: number;
  viewAllHref?: string;
}

function ActivityCard({
  activity,
  dateReference,
}: {
  activity: Activity;
  dateReference: RelativeDateReference;
}) {
  if (activity.type === "quiz") {
    return <QuizActivityCard activity={activity} dateReference={dateReference} />;
  }

  return <FlashcardActivityCard activity={activity} dateReference={dateReference} />;
}

export function RecentActivity({
  className = "",
  limit = 7,
  viewAllHref,
}: RecentActivityProps) {
  const { data, isLoading, isError, refetch } = useRecentActivity(limit);

  if (isLoading) {
    return <RecentActivitySkeleton className={className} />;
  }

  if (isError || !data) {
    return (
      <div className={cn("tactile-card p-8", className)}>
        <p className="text-center text-ink-soft">학습 기록을 불러올 수 없습니다.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mx-auto mt-3 block text-sm font-bold text-teal-edge underline underline-offset-2"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (data.activities.length === 0) {
    return (
      <section className={cn("tactile-card p-8", className)} aria-label="최근 학습 기록">
        <h3 className="mb-6 font-display text-2xl font-bold text-ink">최근 학습 기록</h3>
        <div className="space-y-3 py-8 text-center">
          <div className="tactile-tile mx-auto h-16 w-16 border-teal bg-teal-tint text-3xl">
            <span aria-hidden="true">📚</span>
          </div>
          <p className="text-ink">아직 학습 기록이 없습니다</p>
          <p className="text-sm text-ink-soft">퀴즈나 플래시카드로 학습을 시작해보세요!</p>
        </div>
      </section>
    );
  }

  const showViewAll = Boolean(viewAllHref) && data.totalActivities > data.activities.length;
  const dateReference = createRelativeDateReference(new Date());

  return (
    <section className={cn("tactile-card p-8", className)} aria-label="최근 학습 기록">
      <div className="mb-6">
        <h3 className="mb-1 font-display text-2xl font-bold text-ink">최근 학습 기록</h3>
        <p className="text-sm text-ink-soft">최근 {data.activities.length}개의 학습 활동</p>
      </div>

      <div className="space-y-3">
        {data.activities.map((activity, index) => (
          <div
            key={getActivityKey(activity, index)}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <ActivityCard activity={activity} dateReference={dateReference} />
          </div>
        ))}
      </div>

      {showViewAll && viewAllHref && (
        <div className="mt-6 text-center">
          <Link
            href={viewAllHref}
            className="text-sm font-bold text-teal-edge transition-colors hover:text-teal"
          >
            더 보기 →
          </Link>
        </div>
      )}
    </section>
  );
}
