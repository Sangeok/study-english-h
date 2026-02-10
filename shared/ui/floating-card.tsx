import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FloatingCardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  rotation?: number;
  position?: string;
  children?: ReactNode;
  className?: string;
  gradient?: 'purple' | 'violet' | 'indigo';
}

export function FloatingCard({
  icon,
  title,
  subtitle,
  badge,
  rotation = 0,
  position = "absolute",
  children,
  className,
  gradient
}: FloatingCardProps) {
  const gradientClass = gradient
    ? `bg-gradient-to-br from-${gradient}-500 to-${gradient}-600 text-white`
    : "bg-white border border-purple-100";

  return (
    <div
      className={cn(
        position,
        "rounded-3xl shadow-xl p-6 hover:scale-105 transition-transform duration-300",
        gradientClass,
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {badge && (
        <div className={cn(
          "absolute top-4 right-4 px-2 py-1 text-xs font-semibold rounded-full",
          gradient ? "bg-white/30 backdrop-blur-sm text-white" : "bg-violet-500 text-white"
        )}>
          {badge}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          gradient ? "bg-white/20 backdrop-blur-sm" : "bg-gradient-to-br from-purple-500 to-purple-600"
        )}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className={cn(
            "font-display font-bold",
            gradient ? "text-white" : "text-purple-950"
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-xs",
            gradient ? "text-white opacity-90" : "text-purple-700"
          )}>
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
