import type { VocabularyCard } from "../types";

type MasteryLevel = VocabularyCard["masteryLevel"];

export const MASTERY_STYLES: Record<MasteryLevel, string> = {
  new: "bg-gray-200 text-gray-700",
  learning: "bg-yellow-200 text-yellow-800",
  reviewing: "bg-blue-200 text-blue-800",
  mastered: "bg-green-200 text-green-800",
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: "🆕 새로운 단어",
  learning: "📖 학습 중",
  reviewing: "🔄 복습 중",
  mastered: "✨ 숙달",
};

export const MASTERY_RESULT_CARDS: Record<
  MasteryLevel,
  {
    emoji: string;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  new: {
    emoji: "🆕",
    label: "새로운 단어",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-800",
  },
  learning: {
    emoji: "📖",
    label: "학습 중",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
  },
  reviewing: {
    emoji: "🔄",
    label: "복습 중",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
  },
  mastered: {
    emoji: "✨",
    label: "숙달",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
  },
};
