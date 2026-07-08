import type { MasteryLevel } from "../types";

export interface MasteryResultCardStyle {
  emoji: string;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  sublabelColor: string;
}

// 챔버(다크) 화면 위에서 쓰이는 아웃라인 칩 스타일
export const MASTERY_STYLES: Record<MasteryLevel, string> = {
  new: "tactile-chip border-chamber-line bg-chamber-panel text-chamber-soft",
  learning: "tactile-chip border-chamber-line bg-chamber-panel text-gold",
  reviewing: "tactile-chip border-chamber-line bg-chamber-panel text-cobalt-lt",
  mastered: "tactile-chip border-chamber-line bg-chamber-panel text-meadow",
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
