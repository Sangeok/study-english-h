import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
  subtextColor: string;
  extra?: ReactNode;
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
      id: "accuracy",
      label: "Accuracy",
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
      id: "xp",
      label: "XP",
      value: `+${xp}`,
      subtext: "5 XP per correct answer",
      borderColor: "border-purple-200",
      labelColor: "text-purple-700",
      valueColor: "text-purple-900",
      subtextColor: "text-purple-600",
    },
    {
      id: "correct",
      label: "Correct",
      value: String(correct),
      subtext: `${total} questions`,
      borderColor: "border-green-200",
      labelColor: "text-green-700",
      valueColor: "text-green-900",
      subtextColor: "text-green-600",
    },
    {
      id: "total",
      label: "Total",
      value: String(total),
      subtext: "Session complete",
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
          key={stat.id}
          className={cn(
            "bg-white rounded-2xl p-6 shadow-md border-2",
            stat.borderColor
          )}
        >
          <div className="text-center space-y-2">
            <p className={cn("text-sm font-medium", stat.labelColor)}>{stat.label}</p>
            <p className={cn("text-4xl font-bold", stat.valueColor)}>{stat.value}</p>
            {stat.extra}
            {stat.subtext && (
              <p className={cn("text-xs", stat.subtextColor)}>{stat.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
