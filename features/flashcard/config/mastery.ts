import type { MasteryLevel } from "../types";

export interface MasteryResultCardStyle {
  emoji: string;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  sublabelColor: string;
}

export const MASTERY_STYLES: Record<MasteryLevel, string> = {
  new: "bg-gray-200 text-gray-700",
  learning: "bg-yellow-200 text-yellow-800",
  reviewing: "bg-blue-200 text-blue-800",
  mastered: "bg-green-200 text-green-800",
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: "New",
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
};

export const MASTERY_RESULT_CARDS: Record<MasteryLevel, MasteryResultCardStyle> = {
  new: {
    emoji: "N",
    label: "New",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-800",
    sublabelColor: "text-gray-600",
  },
  learning: {
    emoji: "L",
    label: "Learning",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    sublabelColor: "text-yellow-600",
  },
  reviewing: {
    emoji: "R",
    label: "Reviewing",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    sublabelColor: "text-blue-600",
  },
  mastered: {
    emoji: "M",
    label: "Mastered",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    sublabelColor: "text-green-600",
  },
};
