export type AccuracyLevel = "excellent" | "good" | "needsWork";

export const ACCURACY_STYLES: Record<AccuracyLevel, string> = {
  excellent: "border-teal bg-teal-tint text-ink",
  good: "border-gold bg-gold-tint text-ink",
  needsWork: "border-coral bg-coral-tint text-ink",
};

export const ACCURACY_LABELS: Record<AccuracyLevel, string> = {
  excellent: "훌륭해요!",
  good: "괜찮아요",
  needsWork: "힘내세요",
};
