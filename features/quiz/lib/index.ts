export { fetchDailyQuiz, submitQuiz } from "../api/quiz-api";
export type { QuizQuestion } from "@/entities/question";
export type { QuizSubmission, QuizResult, QuizSummary, QuizSubmitResponse } from "../types";
export { BASE_XP_PER_QUESTION, QUIZ_HINT_XP_MULTIPLIER } from "../config/quiz-xp-config";
export { calculateQuestionXP } from "./quiz-xp";
