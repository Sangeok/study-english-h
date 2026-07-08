import {
  ACCURACY_THRESHOLDS,
  type AccuracyStyle,
} from "../config/accuracy-thresholds";

export function getAccuracyStyle(accuracy: number): AccuracyStyle {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
    return { status: "좋음", label: "안정적으로 학습 중" };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) {
    return { status: "주의", label: "조금 더 연습 필요" };
  }

  if (accuracy >= ACCURACY_THRESHOLDS.CRITICAL) {
    return { status: "집중", label: "집중 학습 권장" };
  }

  return { status: "우선", label: "우선순위 높은 약점" };
}
