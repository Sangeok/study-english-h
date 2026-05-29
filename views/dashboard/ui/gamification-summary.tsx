import { StreakDetailCard, LeagueProgress } from "@/features/gamification";

interface GamificationSummaryProps {
  leagueTier: number;
  leaguePoints: number;
  isLoading: boolean;
}

export function GamificationSummary({
  leagueTier, leaguePoints, isLoading,
}: GamificationSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-muted-warm rounded-2xl h-48 animate-pulse" />
        <div className="bg-muted-warm rounded-2xl h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <StreakDetailCard />
      <LeagueProgress currentTier={leagueTier} currentPoints={leaguePoints} />
    </div>
  );
}
