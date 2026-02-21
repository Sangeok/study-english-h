import { cn } from "@/lib/utils";
import { MASTERY_STYLES, MASTERY_LABELS } from "../../config/mastery";
import type { MasteryLevel } from "../../types";

interface MasteryBadgeProps {
  masteryLevel: MasteryLevel;
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
