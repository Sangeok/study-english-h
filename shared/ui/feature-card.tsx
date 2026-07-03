"use client";

import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureCardStatus = "available" | "locked" | "completed" | "coming-soon";

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
  status = "available",
  badge,
  statusIcon,
  onClick,
  className,
}: FeatureCardProps) {
  const isInteractive =
    status === "available" || status === "coming-soon" || status === "completed";
  const isComingSoon = status === "coming-soon";
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={cn(
        "tactile-card p-6 relative",
        isInteractive && "tactile-card--interactive",
        isLocked && "opacity-50 cursor-not-allowed",
        isCompleted && "bg-teal-tint",
        isComingSoon && "bg-grape-tint border-grape",
        className
      )}
    >
      {badge && (
        <div className="tactile-chip absolute top-4 right-4 border-gold bg-gold-tint text-ink">
          {badge}
        </div>
      )}

      <div
        className={cn(
          "tactile-tile w-16 h-16 mb-4 text-3xl",
          isComingSoon && "bg-grape border-grape-edge",
          isCompleted && "bg-teal border-teal-edge",
          !isComingSoon && !isCompleted && "bg-teal-tint border-teal"
        )}
      >
        <span>{icon}</span>
      </div>

      <h4 className="font-display font-bold text-xl mb-2 flex items-center gap-2 text-ink">
        {title}
        {statusIcon}
      </h4>

      <p className="text-sm mb-4 text-ink-soft leading-relaxed">{description}</p>

      <div
        className={cn(
          "flex items-center gap-2 font-bold text-sm",
          isComingSoon ? "text-grape-edge" : "text-teal-edge"
        )}
      >
        <span>{actionLabel}</span>
        {isInteractive && <ArrowRight className="w-4 h-4" />}
      </div>
    </div>
  );
}
