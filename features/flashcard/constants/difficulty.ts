import type { ReviewQuality } from "../types";

export interface DifficultyOption {
  quality: ReviewQuality;
  label: string;
  sublabel: string;
  colorClass: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    quality: "forgot",
    label: "모르겠어요",
    sublabel: "Again",
    colorClass: "bg-red-500 hover:bg-red-600",
  },
  {
    quality: "hard",
    label: "어려워요",
    sublabel: "Hard",
    colorClass: "bg-orange-500 hover:bg-orange-600",
  },
  {
    quality: "normal",
    label: "괜찮아요",
    sublabel: "Good",
    colorClass: "bg-blue-500 hover:bg-blue-600",
  },
  {
    quality: "easy",
    label: "쉬워요",
    sublabel: "Easy",
    colorClass: "bg-green-500 hover:bg-green-600",
  },
];
