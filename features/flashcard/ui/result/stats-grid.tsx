interface StatItem {
  label: string;
  value: string;
  subtext: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
  subtextColor: string;
  extra?: React.ReactNode;
}

interface StatsGridProps {
  accuracy: number;
  xp: number;
  correct: number;
  total: number;
}

export function StatsGrid({ accuracy, xp, correct, total }: StatsGridProps) {
  const stats: StatItem[] = [
    {
      label: "정확도",
      value: `${accuracy.toFixed(1)}%`,
      subtext: "",
      borderColor: "border-blue-200",
      labelColor: "text-blue-700",
      valueColor: "text-blue-900",
      subtextColor: "",
      extra: (
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      ),
    },
    {
      label: "획득 XP",
      value: `+${xp}`,
      subtext: "단어당 5 XP",
      borderColor: "border-purple-200",
      labelColor: "text-purple-700",
      valueColor: "text-purple-900",
      subtextColor: "text-purple-600",
    },
    {
      label: "정답",
      value: String(correct),
      subtext: `${total}문제 중`,
      borderColor: "border-green-200",
      labelColor: "text-green-700",
      valueColor: "text-green-900",
      subtextColor: "text-green-600",
    },
    {
      label: "전체",
      value: String(total),
      subtext: "학습 완료",
      borderColor: "border-orange-200",
      labelColor: "text-orange-700",
      valueColor: "text-orange-900",
      subtextColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-white rounded-2xl p-6 shadow-md border-2 ${stat.borderColor}`}
        >
          <div className="text-center space-y-2">
            <p className={`text-sm font-medium ${stat.labelColor}`}>{stat.label}</p>
            <p className={`text-4xl font-bold ${stat.valueColor}`}>{stat.value}</p>
            {stat.extra}
            {stat.subtext && (
              <p className={`text-xs ${stat.subtextColor}`}>{stat.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
