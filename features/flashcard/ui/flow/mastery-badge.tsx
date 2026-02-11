import { cn } from "@/lib/utils";
import { MASTERY_STYLES, MASTERY_LABELS } from "../../constants/mastery";
import type { VocabularyCard } from "../../types";

interface MasteryBadgeProps {
  masteryLevel: VocabularyCard["masteryLevel"];
}

export function MasteryBadge({ masteryLevel }: MasteryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-4 py-1 rounded-full text-sm font-semibold",
        MASTERY_STYLES[masteryLevel]
      )}
    >
      {MASTERY_LABELS[masteryLevel]}
    </span>
  );
}
