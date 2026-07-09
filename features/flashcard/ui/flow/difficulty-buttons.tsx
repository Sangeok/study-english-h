import { cn } from "@/lib/utils";
import { DIFFICULTY_OPTIONS } from "../../config/difficulty";
import type { ReviewQuality } from "../../types";

interface DifficultyButtonsProps {
  isPending: boolean;
  onReview: (quality: ReviewQuality) => void;
}

export function DifficultyButtons({ isPending, onReview }: DifficultyButtonsProps) {
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <p className="mb-3 text-center font-display text-sm font-bold text-chamber-soft">
        얼마나 잘 외웠나요?
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DIFFICULTY_OPTIONS.map((option, idx) => (
          <button
            key={option.quality}
            onClick={() => onReview(option.quality)}
            disabled={isPending}
            style={{ animationDelay: `${idx * 60}ms` }}
            className={cn(
              "tactile-btn tactile-btn--block animate-[pop-in] flex-col py-4",
              `tactile-btn--${option.colorClass}`
            )}
          >
            <span className="font-display text-base font-bold">{option.label}</span>
            <span className="text-xs font-semibold opacity-80">{option.sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
