"use client";

import { cn } from "@/lib/utils";

interface RecentActivitySkeletonProps {
  className?: string;
}

export function RecentActivitySkeleton({ className }: RecentActivitySkeletonProps) {
  return (
    <div
      className={cn("tactile-card p-8", className)}
      aria-label="학습 기록 로딩 중"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 rounded-lg bg-muted-warm" />
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-16 rounded-2xl bg-muted-warm" />
          ))}
        </div>
      </div>
    </div>
  );
}
