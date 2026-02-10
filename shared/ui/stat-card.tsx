import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardGradient = 'purple' | 'violet' | 'indigo';

const statGradientStyles: Record<StatCardGradient, string> = {
  purple: "bg-gradient-to-br from-purple-100 to-purple-200",
  violet: "bg-gradient-to-br from-violet-100 to-violet-200",
  indigo: "bg-gradient-to-br from-indigo-100 to-indigo-200",
};

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  gradient: StatCardGradient;
  footer?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  gradient,
  footer,
  isLoading = false,
  className
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-3xl p-8 shadow-md", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-purple-700 mb-1">{label}</p>
          <p className="text-4xl font-display font-bold text-purple-950">
            {isLoading ? "-" : value}
          </p>
        </div>
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center",
            statGradientStyles[gradient]
          )}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
      {footer}
    </div>
  );
}
