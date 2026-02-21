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
    label: "Forgot",
    sublabel: "Again",
    colorClass: "bg-red-500 hover:bg-red-600",
  },
  {
    quality: "hard",
    label: "Hard",
    sublabel: "Tough",
    colorClass: "bg-orange-500 hover:bg-orange-600",
  },
  {
    quality: "normal",
    label: "Good",
    sublabel: "Normal",
    colorClass: "bg-blue-500 hover:bg-blue-600",
  },
  {
    quality: "easy",
    label: "Easy",
    sublabel: "Fast",
    colorClass: "bg-green-500 hover:bg-green-600",
  },
];
