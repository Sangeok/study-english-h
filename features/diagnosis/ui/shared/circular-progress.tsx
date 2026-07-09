import { cn } from "@/lib/utils";
import { SVG_CIRCLE } from "../../config";

interface CircularProgressProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  strokeColor?: string;
  trackColor?: string;
  warningColor?: string;
  isWarning?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SIZE_MAP = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-48 h-48",
} as const;

const STROKE_WIDTH_MAP = {
  sm: 10,
  md: 8,
  lg: 6,
} as const;

export function CircularProgress({
  percentage,
  size = "md",
  strokeColor = "var(--teal)",
  trackColor = "var(--border-warm)",
  warningColor = "var(--coral)",
  isWarning = false,
  children,
  className,
}: CircularProgressProps) {
  const { RADIUS, CIRCUMFERENCE, VIEWBOX, CENTER } = SVG_CIRCLE;
  const strokeWidth = STROKE_WIDTH_MAP[size];
  const dashLength = CIRCUMFERENCE * (percentage / 100);
  const activeColor = isWarning ? warningColor : strokeColor;

  return (
    <div className={cn("relative flex-shrink-0", SIZE_MAP[size], className)}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={VIEWBOX}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="opacity-60"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${CIRCUMFERENCE}`}
          className={cn(
            "transition-all duration-1000",
            isWarning && "animate-pulse"
          )}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
