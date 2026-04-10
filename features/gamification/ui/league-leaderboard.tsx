"use client";

import { useState } from "react";
import { useLeagueRanking } from "../hooks/use-league-ranking";
import { LEAGUE_TIERS } from "../config/league-tiers";
import { cn } from "@/lib/utils";

export function LeagueLeaderboard() {
  const [selectedTier, setSelectedTier] = useState(1);
  const { data, isLoading } = useLeagueRanking(selectedTier, 10);

  return (
    <div>
      <h3 className="text-2xl font-bold text-purple-950 mb-6">리그 랭킹</h3>

      {/* 티어 선택 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {LEAGUE_TIERS.map((tier) => (
          <button
            key={tier.tier}
            onClick={() => setSelectedTier(tier.tier)}
            className={cn(
              "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedTier === tier.tier && "bg-purple-600 text-white",
              selectedTier !== tier.tier && "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            <span>{tier.icon}</span>
            <span>{tier.nameKo}</span>
          </button>
        ))}
      </div>

      {/* 랭킹 목록 */}
      {isLoading && <LeaderboardSkeleton />}
      {!isLoading && data && (
        <div className="space-y-2">
          {data.ranking.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-purple-600 w-8">
                  {entry.rank}
                </span>
                <span className="font-medium text-purple-950">
                  {entry.nickname}
                </span>
              </div>
              <span className="font-semibold text-purple-700">
                {entry.points.toLocaleString()} P
              </span>
            </div>
          ))}
          {data.ranking.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              아직 이 티어에 참가자가 없습니다
            </p>
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
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );
}
