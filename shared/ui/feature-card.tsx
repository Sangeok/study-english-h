"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FeatureCardStatus = 'available' | 'locked' | 'completed' | 'coming-soon';

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  status?: FeatureCardStatus;
  badge?: string;
  statusIcon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  actionLabel,
  status = 'available',
  badge,
  statusIcon,
  onClick,
  className
}: FeatureCardProps) {
  const isInteractive = status === 'available' || status === 'coming-soon';

  const statusStyles: Record<FeatureCardStatus, string> = {
    available: "hover:shadow-2xl border-transparent hover:border-purple-200 cursor-pointer",
    locked: "opacity-50 cursor-not-allowed border-gray-200",
    completed: "bg-green-50 border-green-200",
    'coming-soon': "bg-gradient-to-br from-purple-600 to-violet-600 text-white opacity-75 cursor-pointer"
  };

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={cn(
        "group relative bg-white rounded-3xl p-6 shadow-md transition-all duration-300 border",
        statusStyles[status],
        className
      )}
    >
      {badge && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-white/30 backdrop-blur-sm text-xs font-semibold rounded-full">
          {badge}
        </div>
      )}

      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300",
        status === 'coming-soon' ? "bg-white/20 backdrop-blur-sm" : "bg-gradient-to-br from-purple-500 to-purple-600",
        isInteractive && "group-hover:scale-110"
      )}>
        <span className="text-3xl">{icon}</span>
      </div>

      <h4 className={cn(
        "font-display font-bold text-xl mb-2 flex items-center gap-2",
        status === 'coming-soon' ? "text-white" : "text-purple-950"
      )}>
        {title}
        {statusIcon}
      </h4>

      <p className={cn(
        "text-sm mb-4",
        status === 'coming-soon' ? "text-white opacity-90" : "text-purple-700"
      )}>
        {description}
      </p>

      <div className={cn(
        "flex items-center gap-2 font-semibold text-sm",
        status === 'coming-soon' ? "text-white" : "text-purple-600"
      )}>
        <span>{actionLabel}</span>
        {isInteractive && (
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        )}
      </div>
    </div>
  );
}
