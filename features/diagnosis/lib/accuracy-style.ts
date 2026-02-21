import {
  ACCURACY_THRESHOLDS,
  type AccuracyStyle,
} from "../config/accuracy-thresholds";

export function getAccuracyStyle(accuracy: number): AccuracyStyle {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
    return {
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      border: "border-green-200",
      emoji: "좋음",
      label: "안정적으로 학습 중",
    };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) {
    return {
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      emoji: "주의",
      label: "조금 더 연습 필요",
    };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.CRITICAL) {
    return {
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      emoji: "집중",
      label: "집중 학습 권장",
    };
  }

  return {
    gradient: "from-red-500 to-pink-600",
    bg: "bg-red-50",
    border: "border-red-200",
    emoji: "우선",
    label: "우선순위 높은 약점",
  };
}
