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

  const progressPercent =
    data.totalAchievements > 0
      ? Math.round((data.totalUnlocked / data.totalAchievements) * 100)
      : 0;

  return (
    <div className="animate-fade-in">
      {/* Hero — colored solid block, earned/total as giant Fredoka */}
      <div
        className="relative mb-6 overflow-hidden rounded-[28px] border-2 border-gold-edge bg-gold p-8 text-ink"
        style={{
          boxShadow:
            "0 6px 0 0 var(--gold-edge), 0 28px 44px -26px rgba(245,179,52,0.7)",
        }}
      >
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/15" />
        <div className="absolute right-24 -bottom-12 h-36 w-36 rounded-full bg-white/10" />
        <span
          className="pointer-events-none absolute -bottom-6 left-3 select-none text-8xl opacity-15"
          aria-hidden
        >
          🏅
        </span>

        <div className="relative">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
            Achievements
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-6xl font-bold leading-none">
              {data.totalUnlocked}
            </span>
            <span className="mb-1 font-display text-2xl font-bold text-ink/60">
              / {data.totalAchievements}
            </span>
          </div>
          <p className="mb-3 mt-1 font-medium text-ink/70">획득한 업적</p>
          <div className="tactile-progress max-w-md">
            <div
              className="tactile-progress__fill"
              style={{ width: `${progressPercent}%`, background: "var(--ink)" }}
            />
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "tactile-chip shrink-0 whitespace-nowrap font-bold",
                active
                  ? "border-teal bg-teal text-paper"
                  : "border-border-warm bg-paper text-ink-soft"
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* 업적 그리드 (bento) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((achievement, index) => (
          <AchievementCard
            key={achievement.code}
            achievement={achievement}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: AchievementResponse;
  index: number;
}) {
  const isUnlocked = achievement.unlocked;

  return (
    <div
      className={cn(
        "tactile-card animate-pop-in p-5 text-center",
        isUnlocked ? "bg-paper" : "bg-muted-warm opacity-70"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={cn(
          "tactile-tile mx-auto mb-3 h-16 w-16 text-3xl",
          isUnlocked
            ? "border-gold bg-gold-tint"
            : "border-border-warm bg-muted-warm grayscale"
        )}
      >
        <span>{isUnlocked ? achievement.icon : "🔒"}</span>
      </div>
      <p
        className={cn(
          "mb-1 font-display text-sm font-bold",
          isUnlocked ? "text-ink" : "text-ink-soft"
        )}
      >
        {achievement.name}
      </p>
      <p className="text-xs leading-relaxed text-ink-soft">
        {achievement.description}
      </p>
      {isUnlocked && achievement.unlockedAt && (
        <div className="tactile-chip mx-auto mt-3 border-teal bg-teal-tint text-ink">
          {new Date(achievement.unlockedAt).toLocaleDateString("ko-KR")}
        </div>
      )}
      {!isUnlocked && (
        <div className="tactile-chip mx-auto mt-3 border-border-warm bg-paper text-ink-soft">
          미획득
        </div>
      )}
    </div>
  );
}

function AchievementGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-muted-warm rounded-2xl p-6 animate-pulse h-40" />
      ))}
    </div>
  );
}
