import { Trophy } from "lucide-react";
import { LEAGUE_TIERS } from "../config/league-tiers";
import type { LeagueTier } from "../config/league-tiers";

interface LeagueProgressProps {
  currentTier: number;
  currentPoints: number;
}

export function LeagueProgress({ currentTier, currentPoints }: LeagueProgressProps) {
  const tier = LEAGUE_TIERS.find((t) => t.tier === currentTier);
  const nextTier = LEAGUE_TIERS.find((t) => t.tier === currentTier + 1);

  if (!tier) return null;

  const isMaxTier = !nextTier;
  const progressPercent = getProgressPercent(currentPoints, tier, nextTier);

  return (
    <div className="tactile-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="tactile-tile w-14 h-14 bg-gold-tint border-gold text-gold-edge shrink-0">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display font-bold text-lg text-ink">{tier.nameKo}</p>
          <p className="text-sm text-ink-soft tabular-nums">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
      </div>

      {!isMaxTier && nextTier && (
        <>
          <div className="tactile-progress mb-2">
            <div
              className="tactile-progress__fill"
              style={{
                width: `${progressPercent}%`,
                background: "var(--gold)",
              }}
            />
          </div>
          <p className="text-xs text-ink-soft text-right">
            다음 티어: {nextTier.nameKo} ({nextTier.minPoints.toLocaleString()}P)
          </p>
        </>
      )}

      {isMaxTier && (
        <p className="text-sm text-gold-edge font-bold">
          최고 티어를 달성했어요
        </p>
      )}
    </div>
  );
}

function getProgressPercent(
  points: number,
  current: LeagueTier,
  next: LeagueTier | undefined
): number {
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  if (range <= 0) return 100;
  const progress = points - current.minPoints;
  return Math.min(Math.round((progress / range) * 100), 100);
}
