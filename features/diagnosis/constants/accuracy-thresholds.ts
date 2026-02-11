export const ACCURACY_THRESHOLDS = {
  WEAK: 60,
  MODERATE: 75,
  GOOD: 80,
} as const;

interface AccuracyStyle {
  gradient: string;
  bg: string;
  border: string;
  emoji: string;
  label: string;
}

export function getAccuracyStyle(accuracy: number): AccuracyStyle {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
    return {
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      border: "border-green-200",
      emoji: "✅",
      label: "잘하고 있어요",
    };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) {
    return {
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      emoji: "💪",
      label: "조금 더 노력",
    };
  }

  if (accuracy >= 40) {
    return {
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      emoji: "📚",
      label: "집중 학습 필요",
    };
  }

  return {
    gradient: "from-red-500 to-pink-600",
    bg: "bg-red-50",
    border: "border-red-200",
    emoji: "⚠️",
    label: "집중 학습 필요",
  };
}
