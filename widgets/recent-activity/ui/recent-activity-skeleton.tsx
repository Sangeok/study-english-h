"use client";

import { cn } from "@/lib/utils";

interface RecentActivitySkeletonProps {
  className?: string;
}

export function RecentActivitySkeleton({ className }: RecentActivitySkeletonProps) {
  return (
    <div
      className={cn("bg-white rounded-3xl p-8 shadow-md", className)}
      aria-label="학습 기록 로딩 중"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
