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
  new: "tactile-chip border-border-strong bg-muted-warm text-ink",
  learning: "tactile-chip border-gold bg-gold-tint text-ink",
  reviewing: "tactile-chip border-ocean bg-ocean-tint text-ink",
  mastered: "tactile-chip border-teal bg-teal-tint text-ink",
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: "신규",
  learning: "학습 중",
  reviewing: "복습 중",
  mastered: "완료",
};

export const MASTERY_RESULT_CARDS: Record<MasteryLevel, MasteryResultCardStyle> = {
  new: {
    emoji: "🌱",
    label: "신규",
    bgColor: "bg-muted-warm",
    borderColor: "border-border-strong",
    textColor: "text-ink",
    sublabelColor: "text-ink-soft",
  },
  learning: {
    emoji: "📖",
    label: "학습 중",
    bgColor: "bg-gold-tint",
    borderColor: "border-gold",
    textColor: "text-ink",
    sublabelColor: "text-gold-edge",
  },
  reviewing: {
    emoji: "🔁",
    label: "복습 중",
    bgColor: "bg-ocean-tint",
    borderColor: "border-ocean",
    textColor: "text-ink",
    sublabelColor: "text-ocean-edge",
  },
  mastered: {
    emoji: "🏆",
    label: "완료",
    bgColor: "bg-teal-tint",
    borderColor: "border-teal",
    textColor: "text-ink",
    sublabelColor: "text-teal-edge",
  },
};
