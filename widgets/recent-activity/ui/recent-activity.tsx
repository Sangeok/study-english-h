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
      <div className={cn("bg-white rounded-3xl p-8 shadow-md", className)}>
        <p className="text-center text-purple-700">학습 기록을 불러올 수 없습니다.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mx-auto mt-3 block text-sm text-purple-700 underline underline-offset-2 hover:text-purple-800"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (data.activities.length === 0) {
    return (
      <section className={cn("bg-white rounded-3xl p-8 shadow-md", className)} aria-label="최근 학습 기록">
        <h3 className="font-display font-bold text-2xl text-purple-950 mb-6">최근 학습 기록</h3>
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl" aria-hidden="true">📚</span>
          </div>
          <p className="text-purple-700">아직 학습 기록이 없습니다</p>
          <p className="text-sm text-purple-600">퀴즈나 플래시카드로 학습을 시작해보세요!</p>
        </div>
      </section>
    );
  }

  const showViewAll = Boolean(viewAllHref) && data.totalActivities > data.activities.length;
  const dateReference = createRelativeDateReference(new Date());

  return (
    <section className={cn("bg-white rounded-3xl p-8 shadow-md", className)} aria-label="최근 학습 기록">
      <div className="mb-6">
        <h3 className="font-display font-bold text-2xl text-purple-950 mb-2">최근 학습 기록</h3>
        <p className="text-sm text-purple-700">최근 {data.activities.length}개의 학습 활동</p>
      </div>

      <div className="space-y-3">
        {data.activities.map((activity, index) => (
          <ActivityCard
            key={getActivityKey(activity, index)}
            activity={activity}
            dateReference={dateReference}
          />
        ))}
      </div>

      {showViewAll && viewAllHref && (
        <div className="mt-6 text-center">
          <Link
            href={viewAllHref}
            className="text-purple-600 font-semibold hover:text-purple-700 transition-colors text-sm"
          >
            더 보기 →
          </Link>
        </div>
      )}
    </section>
  );
}
