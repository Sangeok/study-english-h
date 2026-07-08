"use client";

import { Snowflake } from "lucide-react";
import { useStreakDetails } from "../hooks/use-streak-details";
import { STREAK_MILESTONES } from "../config/streak-milestones";
import { cn } from "@/lib/utils";

export function StreakDetailCard() {
  const { data, isLoading } = useStreakDetails();

  if (isLoading) {
    return <div className="bg-muted-warm rounded-2xl h-48 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="tactile-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-display font-bold text-ink">연속 학습</h3>
          <p className="text-4xl font-display font-bold tabular-nums text-coral mt-1">
            {data.currentStreak}일
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-soft">최장 기록</p>
          <p className="text-lg font-bold text-ink">{data.longestStreak}일</p>
        </div>
      </div>

      {/* Freeze 보유 */}
      <div className="flex items-center gap-2 mb-6 bg-ocean-tint border border-ocean rounded-xl px-4 py-3">
        <Snowflake className="h-4 w-4 text-ocean-edge" />
        <span className="text-sm text-ink">
          스트릭 보호권 <strong className="text-ocean-edge">{data.freezeCount}개</strong> 보유
        </span>
      </div>

      {/* 마일스톤 진행도 */}
      <div>
        <p className="text-sm font-bold text-ink-soft mb-3">마일스톤</p>
        <div className="space-y-3">
          {STREAK_MILESTONES.map((milestone) => {
            const achieved = data.currentStreak >= milestone.days;
            const progress = Math.min(
              (data.currentStreak / milestone.days) * 100,
              100
            );

            return (
              <div key={milestone.days} className="flex items-center gap-3">
                <span className={cn(
                  "text-sm font-bold w-12",
                  achieved && "text-coral",
                  !achieved && "text-ink-soft/60"
                )}>
                  {milestone.days}일
                </span>
                <div className="tactile-progress flex-1 h-3">
                  <div
                    className={cn(
                      "tactile-progress__fill",
                      !achieved && "opacity-60"
                    )}
                    style={{
                      width: `${progress}%`,
                      background: achieved ? "var(--coral)" : "var(--coral)",
                    }}
                  />
                </div>
                <span className="text-xs text-ink-soft w-28 text-right tabular-nums">
                  +{milestone.xpReward}XP · 보호권 {milestone.freezeReward}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
