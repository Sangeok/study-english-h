"use client";

import { useState } from "react";
import { useLeagueRanking } from "../hooks/use-league-ranking";
import { LEAGUE_TIERS } from "../config/league-tiers";
import { cn } from "@/lib/utils";

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;

function rankChipClass(rank: number): string {
  if (rank === 1) return "border-gold bg-gold text-ink";
  if (rank === 2) return "border-ocean bg-ocean-tint text-ink";
  if (rank === 3) return "border-coral bg-coral-tint text-ink";
  return "border-border-warm bg-paper text-ink-soft";
}

export function LeagueLeaderboard() {
  const [selectedTier, setSelectedTier] = useState(1);
  const { data, isLoading } = useLeagueRanking(selectedTier, 10);

  const activeTier = LEAGUE_TIERS.find((t) => t.tier === selectedTier);

  return (
    <div className="animate-fade-in">
      {/* Hero — colored solid tier block */}
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
          className="pointer-events-none absolute -bottom-6 left-4 select-none text-8xl opacity-15"
          aria-hidden
        >
          🏆
        </span>

        <div className="relative">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
            League
          </p>
          <div className="mt-2 flex items-center gap-4">
            <span className="text-6xl leading-none drop-shadow-sm" aria-hidden>
              {activeTier?.icon}
            </span>
            <div>
              <p className="font-display text-5xl font-bold leading-none md:text-6xl">
                {activeTier?.nameKo}
              </p>
              <p className="mt-2 font-medium text-ink/70">
                {activeTier?.minPoints.toLocaleString()}P 이상 · 상위 랭킹
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 티어 선택 탭 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {LEAGUE_TIERS.map((tier) => {
          const active = selectedTier === tier.tier;
          return (
            <button
              key={tier.tier}
              onClick={() => setSelectedTier(tier.tier)}
              className={cn(
                "tactile-chip shrink-0 whitespace-nowrap",
                active
                  ? "border-gold bg-gold text-ink"
                  : "border-border-warm bg-paper text-ink-soft"
              )}
            >
              <span>{tier.icon}</span>
              <span className="font-display font-bold">{tier.nameKo}</span>
            </button>
          );
        })}
      </div>

      {/* 랭킹 목록 */}
      {isLoading && <LeaderboardSkeleton />}
      {!isLoading && data && (
        <div className="space-y-2">
          {data.ranking.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.userId}
                className={cn(
                  "tactile-card flex items-center justify-between px-5 py-4 animate-slide-up",
                  isTop3 && "border-gold bg-gold-tint"
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "tactile-chip h-10 w-10 justify-center px-0 font-display text-lg font-bold",
                      rankChipClass(entry.rank)
                    )}
                  >
                    {isTop3 ? RANK_MEDALS[entry.rank - 1] : entry.rank}
                  </span>
                  <span className="font-bold text-ink">{entry.nickname}</span>
                </div>
                <span className="font-display text-lg font-bold text-gold-edge">
                  {entry.points.toLocaleString()}
                  <span className="ml-1 text-sm text-ink-soft">P</span>
                </span>
              </div>
            );
          })}
          {data.ranking.length === 0 && (
            <div className="tactile-card flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-4xl" aria-hidden>
                🪺
              </span>
              <p className="text-ink-soft">아직 이 티어에 참가자가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-muted-warm rounded-2xl h-16 animate-pulse" />
      ))}
    </div>
  );
}
