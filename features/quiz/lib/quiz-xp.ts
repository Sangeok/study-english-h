import { BASE_XP_PER_QUESTION, QUIZ_HINT_XP_MULTIPLIER } from "../config/quiz-xp-config";

export { BASE_XP_PER_QUESTION, QUIZ_HINT_XP_MULTIPLIER };

export function calculateQuestionXP(isCorrect: boolean, hintLevel: 0 | 1 | 2): number {
  if (!isCorrect) {
    return 0;
  }

  return Math.floor(BASE_XP_PER_QUESTION * QUIZ_HINT_XP_MULTIPLIER[hintLevel]);
}

