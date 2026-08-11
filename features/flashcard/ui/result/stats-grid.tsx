import { cn } from "@/lib/utils";
import { formatSessionDuration } from "../../lib/format-session-duration";

type StatTone = "gold" | "ocean" | "grape";

interface StatItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  tone: StatTone;
}

interface StatsGridProps {
  xp: number;
  durationSec: number;
  total: number;
}

const toneSurface: Record<StatTone, string> = {
  gold: "bg-gold border-gold-edge",
  ocean: "bg-ocean border-ocean-edge",
  grape: "bg-grape border-grape-edge",
};

export function StatsGrid({ xp, durationSec, total }: StatsGridProps) {
  const averageSec = total > 0 ? Math.round(durationSec / total) : 0;

  const stats: StatItem[] = [
    {
      id: "xp",
      label: "획득 XP",
      value: `+${xp}`,
      // xpEarned = 기억한 카드 수 × 5 (app/api/flashcard/review/route.ts)
      subtext: "기억한 카드당 5 XP",
      tone: "gold",
    },
    {
      id: "duration",
      label: "학습 시간",
      value: formatSessionDuration(durationSec),
      subtext: `카드 ${total}장`,
      tone: "ocean",
    },
    {
      id: "average",
      label: "카드당 평균",
      value: formatSessionDuration(averageSec),
      subtext: "한 장에 쓴 시간",
      tone: "grape",
    },
  ];

  // gold tile keeps ink text for legibility (XP convention); others are white-on-color.
  const isGold = (tone: StatTone) => tone === "gold";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, idx) => (
        <div
          key={stat.id}
          style={{ animationDelay: `${idx * 70}ms` }}
          className={cn(
            "relative overflow-hidden rounded-[22px] border p-5 animate-[pop-in]",
            toneSurface[stat.tone],
            isGold(stat.tone) ? "text-ink" : "text-white"
          )}
        >
          <p
            className={cn(
              "relative font-display text-[11px] font-bold uppercase tracking-[0.2em]",
              isGold(stat.tone) ? "text-ink/70" : "text-white/80"
            )}
          >
            {stat.label}
          </p>
          <p className="relative mt-1 font-display text-3xl font-bold tracking-tight tabular-nums">
            {stat.value}
          </p>
          <p
            className={cn(
              "relative mt-1 text-xs font-medium",
              isGold(stat.tone) ? "text-ink/70" : "text-white/80"
            )}
          >
            {stat.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
