import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { MASTERY_RESULT_CARDS } from "../../config/mastery";
import type { MasteryLevel } from "../../types";

const MASTERY_ORDER: MasteryLevel[] = ["new", "learning", "reviewing", "mastered"];

interface MasteryBreakdownProps {
  breakdown: Partial<Record<MasteryLevel, number>>;
}

export function MasteryBreakdown({ breakdown }: MasteryBreakdownProps) {
  const hasData = MASTERY_ORDER.some((level) => Boolean(breakdown[level]));

  if (!hasData) {
    return null;
  }

  return (
    <div className="tactile-card p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="tactile-tile h-11 w-11 border-grape bg-grape-tint text-grape-edge">
          <Layers className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink">숙련도 분포</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {MASTERY_ORDER.map((level, idx) => {
          const count = breakdown[level];
          if (!count) {
            return null;
          }

          const card = MASTERY_RESULT_CARDS[level];

          return (
            <div
              key={level}
              style={{ animationDelay: `${idx * 70}ms` }}
              className={cn(
                "rounded-[20px] border p-4 text-center animate-[pop-in]",
                card.bgColor,
                card.borderColor
              )}
            >
              <p className={cn("mb-1 text-xs font-bold uppercase tracking-wide", card.sublabelColor)}>
                {card.label}
              </p>
              <p className={cn("font-display text-3xl font-bold tabular-nums", card.textColor)}>{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
