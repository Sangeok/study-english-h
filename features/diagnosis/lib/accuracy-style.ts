import {
  ACCURACY_THRESHOLDS,
  type AccuracyStyle,
} from "../config/accuracy-thresholds";

export function getAccuracyStyle(accuracy: number): AccuracyStyle {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
    return {
      gradient: "from-teal to-teal-edge",
      bg: "bg-teal-tint",
      border: "border-teal",
      emoji: "좋음",
      label: "안정적으로 학습 중",
    };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) {
    return {
      gradient: "from-gold to-gold-edge",
      bg: "bg-gold-tint",
      border: "border-gold",
      emoji: "주의",
      label: "조금 더 연습 필요",
    };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.CRITICAL) {
    return {
      gradient: "from-coral to-gold",
      bg: "bg-coral-tint",
      border: "border-coral",
      emoji: "집중",
      label: "집중 학습 권장",
    };
  }

  return {
    gradient: "from-coral to-coral-edge",
    bg: "bg-coral-tint",
    border: "border-coral",
    emoji: "우선",
    label: "우선순위 높은 약점",
  };
}
