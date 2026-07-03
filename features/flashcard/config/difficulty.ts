import type { ReviewQuality } from "../types";

export interface DifficultyOption {
  quality: ReviewQuality;
  label: string;
  sublabel: string;
  colorClass: string;
}

// colorClass maps each review quality to a tactile button tone.
// Used by DifficultyButtons as: `tactile-btn tactile-btn--${colorClass}`.
export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    quality: "forgot",
    label: "잊음",
    sublabel: "다시 보기",
    colorClass: "coral",
  },
  {
    quality: "hard",
    label: "어려움",
    sublabel: "힘들었어요",
    colorClass: "gold",
  },
  {
    quality: "normal",
    label: "보통",
    sublabel: "괜찮아요",
    colorClass: "ocean",
  },
  {
    quality: "easy",
    label: "쉬움",
    sublabel: "잘 알아요",
    colorClass: "teal",
  },
];
