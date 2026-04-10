"use client";

import { useStreakDetails } from "../hooks/use-streak-details";
import { STREAK_MILESTONES } from "../config/streak-milestones";
import { cn } from "@/lib/utils";

export function StreakDetailCard() {
  const { data, isLoading } = useStreakDetails();

  if (isLoading) {
    return <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-purple-950">연속 학습</h3>
          <p className="text-4xl font-bold text-purple-600 mt-1">
            {data.currentStreak}일
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">최장 기록</p>
          <p className="text-lg font-semibold text-purple-800">
            {data.longestStreak}일
          </p>
        </div>
      </div>

      {/* Freeze 보유 */}
      <div className="flex items-center gap-2 mb-6 bg-blue-50 rounded-xl px-4 py-3">
        <span className="text-xl">🧊</span>
        <span className="text-sm text-blue-800">
          스트릭 보호권 <strong>{data.freezeCount}개</strong> 보유
        </span>
      </div>

      {/* 마일스톤 진행도 */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-3">마일스톤</p>
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
                  "text-sm font-medium w-12",
                  achieved && "text-purple-600",
                  !achieved && "text-gray-400"
                )}>
                  {milestone.days}일
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      achieved && "bg-purple-600",
                      !achieved && "bg-purple-300"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  +{milestone.xpReward}XP, {milestone.freezeReward}🧊
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
