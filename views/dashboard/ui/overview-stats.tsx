import { cn } from "@/lib/utils";

interface OverviewStatsProps {
  totalXP: number;
  streak: number;
  level: string;
  totalWordLearned: number;
  masteredWords: number;
  longestStreak: number;
  hasCompletedDiagnosis: boolean;
  isLoading: boolean;
}

type StatTone = "ocean" | "teal" | "coral";

const toneSurface: Record<StatTone, string> = {
  ocean: "bg-ocean border-ocean-edge",
  teal: "bg-teal border-teal-edge",
  coral: "bg-coral border-coral-edge",
};

const toneEdge: Record<StatTone, string> = {
  ocean: "var(--ocean-edge)",
  teal: "var(--teal-edge)",
  coral: "var(--coral-edge)",
};

interface BentoStatProps {
  tone: StatTone;
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  isLoading: boolean;
}

function BentoStat({ tone, icon, label, value, sub, isLoading }: BentoStatProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] border-2 p-6 text-white",
        toneSurface[tone]
      )}
      style={{ boxShadow: `0 5px 0 0 ${toneEdge[tone]}` }}
    >
      <span
        className="pointer-events-none absolute -bottom-4 -right-2 select-none text-7xl opacity-20"
        aria-hidden
      >
        {icon}
      </span>
      <p className="relative text-sm font-semibold text-white/80">{label}</p>
      <p className="relative mt-1 font-display text-4xl font-bold tracking-tight">
        {isLoading ? "—" : value}
      </p>
      <p className="relative mt-1 text-xs font-medium text-white/75">{sub}</p>
    </div>
  );
}

export function OverviewStats({
  totalWordLearned,
  masteredWords,
  longestStreak,
  isLoading,
}: OverviewStatsProps) {
  return (
    <div className="mb-5 grid gap-5 sm:grid-cols-3">
      <BentoStat
        tone="ocean"
        icon="📚"
        label="학습한 단어"
        value={totalWordLearned}
        sub={`마스터까지 ${Math.max(totalWordLearned - masteredWords, 0)}개`}
        isLoading={isLoading}
      />
      <BentoStat
        tone="teal"
        icon="🏅"
        label="마스터한 단어"
        value={masteredWords}
        sub="완벽하게 암기했어요"
        isLoading={isLoading}
      />
      <BentoStat
        tone="coral"
        icon="🔥"
        label="최장 연속 학습"
        value={`${longestStreak}일`}
        sub="최고 기록에 도전!"
        isLoading={isLoading}
      />
    </div>
  );
}
