"use client";

import { useState } from "react";
import { useAchievements } from "../hooks/use-achievements";
import { cn } from "@/lib/utils";
import type { AchievementResponse } from "../types";

const CATEGORIES = ["all", "learning", "streak", "accuracy", "league", "special"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: "전체",
  learning: "학습",
  streak: "연속 학습",
  accuracy: "정확도",
  league: "리그",
  special: "특별",
};

export function AchievementGallery() {
  const { data, isLoading } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (isLoading) {
    return <AchievementGallerySkeleton />;
  }

  if (!data) return null;

  const filtered = selectedCategory === "all"
    ? data.all
    : data.all.filter((a) => a.category === selectedCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-purple-950">
          업적 ({data.totalUnlocked}/{data.totalAchievements})
        </h3>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat && "bg-purple-600 text-white",
              selectedCategory !== cat && "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 업적 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((achievement) => (
          <AchievementCard key={achievement.code} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementResponse }) {
  const isUnlocked = achievement.unlocked;
  const displayIcon = isUnlocked ? achievement.icon : "🔒";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 text-center transition-all",
        isUnlocked && "bg-white shadow-md",
        !isUnlocked && "bg-gray-100 opacity-60"
      )}
    >
      <div className="text-4xl mb-3">{displayIcon}</div>
      <p className="font-semibold text-sm text-purple-950 mb-1">
        {achievement.name}
      </p>
      <p className="text-xs text-gray-500">
        {achievement.description}
      </p>
      {isUnlocked && achievement.unlockedAt && (
        <p className="text-xs text-purple-600 mt-2">
          {new Date(achievement.unlockedAt).toLocaleDateString("ko-KR")}
        </p>
      )}
    </div>
  );
}

function AchievementGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 bg-gray-100 animate-pulse h-32" />
      ))}
    </div>
  );
}
