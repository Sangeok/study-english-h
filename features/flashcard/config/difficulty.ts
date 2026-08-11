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
    colorClass: "teal",
  },
  {
    quality: "easy",
    label: "쉬움",
    sublabel: "잘 알아요",
    colorClass: "meadow",
  },
];

// 결과 화면에서 자기평가 분포를 보여줄 때 쓰는 순서 — 긍정에서 부정 순.
// 세션 중 버튼 순서(DIFFICULTY_OPTIONS)와는 반대이며, 요약 읽기에 맞춘 것이다.
export const QUALITY_RESULT_ORDER: ReviewQuality[] = ["easy", "normal", "hard", "forgot"];

export interface QualityResultCardStyle {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  sublabelColor: string;
}

// 세션 중 버튼 색(DIFFICULTY_OPTIONS.colorClass)과 같은 톤을 유지해
// 방금 누른 버튼과 결과 타일이 같은 것을 가리킨다는 걸 알 수 있게 한다.
export const QUALITY_RESULT_CARDS: Record<ReviewQuality, QualityResultCardStyle> = {
  easy: {
    label: "쉬움",
    bgColor: "bg-meadow-tint",
    borderColor: "border-meadow",
    textColor: "text-ink",
    sublabelColor: "text-meadow",
  },
  normal: {
    label: "보통",
    bgColor: "bg-teal-tint",
    borderColor: "border-teal",
    textColor: "text-ink",
    sublabelColor: "text-teal-edge",
  },
  hard: {
    label: "어려움",
    bgColor: "bg-gold-tint",
    borderColor: "border-gold",
    textColor: "text-ink",
    sublabelColor: "text-gold-edge",
  },
  forgot: {
    label: "잊음",
    bgColor: "bg-coral-tint",
    borderColor: "border-coral",
    textColor: "text-ink",
    sublabelColor: "text-coral-edge",
  },
};
