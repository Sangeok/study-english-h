interface MetricsStripProps {
  totalXP: number;
  streak: number;
  totalWordLearned: number;
  level: string;
  diagnosisCompleted: boolean;
  isLoading: boolean;
}

interface Metric {
  value: string;
  unit?: string;
  caption: string;
}

/** 조판형 지표 라인 — 카드 없이 큰 타블러 숫자로 */
export function MetricsStrip({
  totalXP,
  streak,
  totalWordLearned,
  level,
  diagnosisCompleted,
  isLoading,
}: MetricsStripProps) {
  const metrics: Metric[] = [
    { value: totalXP.toLocaleString(), unit: "XP", caption: "총 경험치" },
    { value: String(streak), unit: "일", caption: "연속 학습" },
    { value: totalWordLearned.toLocaleString(), caption: "학습한 단어" },
    {
      value: diagnosisCompleted ? level : "—",
      caption: diagnosisCompleted ? "현재 레벨" : "레벨 진단 전이에요",
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-13 gap-y-5">
      {metrics.map((m) => (
        <div key={m.caption}>
          <b className="font-display text-[34px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {isLoading ? "—" : m.value}
            {m.unit && !isLoading && (
              <i className="ml-0.5 text-[17px] font-semibold not-italic text-ink-soft">{m.unit}</i>
            )}
          </b>
          <span className="mt-1.5 block text-[13px] text-ink-soft">{m.caption}</span>
        </div>
      ))}
    </div>
  );
}
