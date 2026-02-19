import type { AccuracyLevel } from "../config/accuracy-config";

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
