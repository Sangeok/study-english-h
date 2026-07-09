import { cn } from "@/lib/utils";

type StatTone = "ocean" | "gold" | "teal" | "coral";

interface StatItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  tone: StatTone;
}

interface StatsGridProps {
  accuracy: number;
  xp: number;
  correct: number;
  total: number;
}

const toneSurface: Record<StatTone, string> = {
  ocean: "bg-ocean border-ocean-edge",
  gold: "bg-gold border-gold-edge",
  teal: "bg-teal border-teal-edge",
  coral: "bg-coral border-coral-edge",
};

export function StatsGrid({ accuracy, xp, correct, total }: StatsGridProps) {
  const stats: StatItem[] = [
    {
      id: "accuracy",
      label: "정답률",
      value: `${accuracy.toFixed(1)}%`,
      subtext: "이번 세션 정답률",
      tone: "ocean",
    },
    {
      id: "xp",
      label: "획득 XP",
      value: `+${xp}`,
      subtext: "정답당 5 XP",
      tone: "gold",
    },
    {
      id: "correct",
      label: "정답",
      value: String(correct),
      subtext: `총 ${total}문제`,
      tone: "teal",
    },
    {
      id: "total",
      label: "전체",
      value: String(total),
      subtext: "이번 세션 완료",
      tone: "coral",
    },
  ];

  // gold tile keeps ink text for legibility (XP convention); others are white-on-color.
  const isGold = (tone: StatTone) => tone === "gold";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
