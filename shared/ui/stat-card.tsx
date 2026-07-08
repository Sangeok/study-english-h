import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardTone = "gold" | "coral" | "ocean";

const toneStyles: Record<
  StatCardTone,
  { tile: string; label: string; value: string }
> = {
  gold: {
    tile: "bg-gold-tint border-gold text-ink",
    label: "text-ink-soft",
    value: "text-ink",
  },
  coral: {
    tile: "bg-coral-tint border-coral text-ink",
    label: "text-ink-soft",
    value: "text-ink",
  },
  ocean: {
    tile: "bg-ocean-tint border-ocean text-ink",
    label: "text-ink-soft",
    value: "text-ink",
  },
};

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  tone: StatCardTone;
  footer?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  tone,
  footer,
  isLoading = false,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn("tactile-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={cn("text-sm font-semibold mb-1", styles.label)}>{label}</p>
          <p className={cn("text-4xl font-display font-bold tracking-tight", styles.value)}>
            {isLoading ? "—" : value}
          </p>
        </div>
        <div
          className={cn(
            "tactile-tile w-14 h-14 text-2xl shrink-0",
            styles.tile
          )}
        >
          <span>{icon}</span>
        </div>
      </div>
      {footer}
    </div>
  );
}
