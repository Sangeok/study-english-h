import type { Activity } from "../model";

export function getActivityKey(activity: Activity, index: number): string {
  if (activity.type === "quiz") {
    return `quiz-${activity.date}-${activity.totalQuestions}-${activity.correctAnswers}-${index}`;
  }

  return `flashcard-${activity.date}-${activity.vocabularyCount}-${activity.duration}-${index}`;
}
