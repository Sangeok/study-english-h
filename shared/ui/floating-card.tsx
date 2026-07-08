import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FloatingCardTone = "teal" | "coral" | "ocean";

export interface FloatingCardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  rotation?: number;
  position?: string;
  children?: ReactNode;
  className?: string;
  tone?: FloatingCardTone;
}

const toneStyles: Record<
  FloatingCardTone,
  { surface: string; tile: string; title: string; subtitle: string; badge: string }
> = {
  teal: {
    surface: "bg-teal border-teal-edge text-white",
    tile: "bg-white/20 border-white/30",
    title: "text-white",
    subtitle: "text-white/85",
    badge: "bg-white/25 border-white/30 text-white",
  },
  coral: {
    surface: "bg-coral border-coral-edge text-white",
    tile: "bg-white/20 border-white/30",
    title: "text-white",
    subtitle: "text-white/85",
    badge: "bg-white/25 border-white/30 text-white",
  },
  ocean: {
    surface: "bg-ocean border-ocean-edge text-white",
    tile: "bg-white/20 border-white/30",
    title: "text-white",
    subtitle: "text-white/85",
    badge: "bg-white/25 border-white/30 text-white",
  },
};

export function FloatingCard({
  icon,
  title,
  subtitle,
  badge,
  rotation = 0,
  position = "absolute",
  children,
  className,
  tone,
}: FloatingCardProps) {
  const s = tone ? toneStyles[tone] : null;

  return (
    <div
      className={cn(
        position,
        "rounded-[20px] border-2 p-6 transition-transform duration-300 hover:-translate-y-1",
        s ? s.surface : "tactile-card",
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        boxShadow: s
          ? "0 6px 0 0 rgba(0,0,0,0.12), 0 18px 30px -18px rgba(34,50,79,0.5)"
          : undefined,
      }}
    >
      {badge && (
        <div
          className={cn(
            "tactile-chip absolute top-4 right-4",
            s ? s.badge : "border-coral bg-coral-tint text-ink"
          )}
        >
          {badge}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "tactile-tile w-12 h-12 text-2xl",
            s ? s.tile : "bg-teal-tint border-teal"
          )}
        >
          <span>{icon}</span>
        </div>
        <div>
          <h3 className={cn("font-display font-bold", s ? s.title : "text-ink")}>
            {title}
          </h3>
          <p className={cn("text-xs", s ? s.subtitle : "text-ink-soft")}>{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
