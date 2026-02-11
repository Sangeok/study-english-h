import { cn } from "@/lib/utils";
import { MASTERY_RESULT_CARDS } from "../../constants/mastery";
import type { VocabularyCard } from "../../types";

type MasteryLevel = VocabularyCard["masteryLevel"];

const MASTERY_ORDER: MasteryLevel[] = ["new", "learning", "reviewing", "mastered"];

interface MasteryBreakdownProps {
  breakdown: Record<string, number>;
}

export function MasteryBreakdown({ breakdown }: MasteryBreakdownProps) {
  const hasData = MASTERY_ORDER.some((level) => breakdown[level]);

  if (!hasData) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">숙달도 분석</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MASTERY_ORDER.map((level) => {
          const count = breakdown[level];
          if (!count) return null;

          const card = MASTERY_RESULT_CARDS[level];

          return (
            <div
              key={level}
              className={cn("rounded-2xl p-4 border-2", card.bgColor, card.borderColor)}
            >
              <div className="text-center">
                <p className="text-2xl mb-1">{card.emoji}</p>
                <p className={`text-sm mb-1 ${card.textColor.replace("800", "600").replace("700", "600")}`}>
                  {card.label}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{count}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
