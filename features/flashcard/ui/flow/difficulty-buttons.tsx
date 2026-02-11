import { cn } from "@/lib/utils";
import { DIFFICULTY_OPTIONS } from "../../constants/difficulty";
import type { ReviewQuality } from "../../types";

interface DifficultyButtonsProps {
  isPending: boolean;
  onReview: (quality: ReviewQuality) => void;
}

export function DifficultyButtons({ isPending, onReview }: DifficultyButtonsProps) {
  return (
    <div className="max-w-2xl mx-auto mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {DIFFICULTY_OPTIONS.map((option) => (
        <button
          key={option.quality}
          onClick={() => onReview(option.quality)}
          disabled={isPending}
          className={cn(
            "px-6 py-4 text-white rounded-xl disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105",
            option.colorClass
          )}
        >
          {option.label}
          <br />
          <span className="text-xs opacity-80">{option.sublabel}</span>
        </button>
      ))}
    </div>
  );
}
