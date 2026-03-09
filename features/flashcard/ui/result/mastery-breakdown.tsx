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
    <div className="bg-white rounded-3xl p-8 shadow-md">
      <h2 className="text-2xl font-sans font-bold text-gray-800 mb-6">Mastery Breakdown</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MASTERY_ORDER.map((level) => {
          const count = breakdown[level];
          if (!count) {
            return null;
          }

          const card = MASTERY_RESULT_CARDS[level];

          return (
            <div
              key={level}
              className={cn("rounded-2xl p-4 border-2", card.bgColor, card.borderColor)}
            >
              <div className="text-center">
                <p className="text-2xl mb-1">{card.emoji}</p>
                <p className={cn("text-sm mb-1", card.sublabelColor)}>{card.label}</p>
                <p className={cn("text-2xl font-bold", card.textColor)}>{count}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
