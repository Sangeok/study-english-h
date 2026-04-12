import { StatCard } from "@/shared/ui";

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

export function OverviewStats({
  totalXP, streak, level, totalWordLearned, masteredWords, longestStreak, hasCompletedDiagnosis, isLoading,
}: OverviewStatsProps) {
  const levelText = hasCompletedDiagnosis ? `레벨: ${level}` : "진단 미완료";

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <StatCard
        icon="⭐"
        label="총 경험치"
        value={totalXP.toLocaleString()}
        gradient="purple"
        isLoading={isLoading}
        footer={
          <p className="text-sm text-purple-600 font-medium">
            {levelText}
          </p>
        }
      />
      <StatCard
        icon="🔥"
        label="연속 학습"
        value={`${streak}일`}
        gradient="violet"
        isLoading={isLoading}
        footer={
          <p className="text-sm text-purple-600">
            최장: {longestStreak}일
          </p>
        }
      />
      <StatCard
        icon="📚"
        label="학습 단어"
        value={String(totalWordLearned)}
        gradient="indigo"
        isLoading={isLoading}
        footer={
          <p className="text-sm text-purple-600">
            마스터: {masteredWords}개
          </p>
        }
      />
    </div>
  );
}
