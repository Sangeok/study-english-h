export type AccuracyLevel = "excellent" | "good" | "needsWork";

export const ACCURACY_STYLES: Record<AccuracyLevel, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-yellow-100 text-yellow-700",
  needsWork: "bg-orange-100 text-orange-700",
};

export const ACCURACY_LABELS: Record<AccuracyLevel, string> = {
  excellent: "훌륭해요!",
  good: "괜찮아요",
  needsWork: "힘내세요",
};

export function getQuizAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0;
    
  }

  return Math.round((correctAnswers / totalQuestions) * 100);
}

export function getAverageSeconds(totalTime: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0;
  }

  return Math.round(totalTime / totalQuestions);
}

export function getAccuracyLevel(accuracy: number): AccuracyLevel {
  if (accuracy >= 80) {
    return "excellent";
  }

  if (accuracy >= 60) {
    return "good";
  }

  return "needsWork";
}
