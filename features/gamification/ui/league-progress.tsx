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
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{tier.icon}</span>
        <div>
          <p className="font-bold text-purple-950">{tier.nameKo}</p>
          <p className="text-sm text-gray-500">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
      </div>

      {!isMaxTier && nextTier && (
        <>
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: tier.color,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            다음 티어: {nextTier.icon} {nextTier.nameKo} ({nextTier.minPoints.toLocaleString()}P)
          </p>
        </>
      )}

      {isMaxTier && (
        <p className="text-sm text-purple-600 font-semibold">
          최고 티어 달성!
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
