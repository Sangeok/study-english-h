import { ACCURACY_THRESHOLDS } from "../config/accuracy-thresholds";

export function getAccuracyFeedback(accuracy: number): string {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
    return "안정적으로 학습 중";
  }

  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) {
    return "조금 더 연습 필요";
  }

  if (accuracy >= ACCURACY_THRESHOLDS.CRITICAL) {
    return "집중 학습 권장";
  }

  return "가장 먼저 보완할 영역";
}
