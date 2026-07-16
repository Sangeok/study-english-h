import type { QuestionDifficulty } from "@/entities/question";
import { TOTAL_DIAGNOSIS_QUESTION_COUNT } from "@/shared/constants";

export const DIFFICULTY_WEIGHTS: Record<QuestionDifficulty, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export const TRANSITION_DURATION_MS = 300;

export const QUESTION_DISTRIBUTION = [
  { level: "A1", count: 6 },
  { level: "A2", count: 5 },
  { level: "B1", count: 4 },
  { level: "B2", count: 3 },
  { level: "C1", count: 2 },
] as const;

export const QUESTION_POOL_MULTIPLIER = 2;

if (QUESTION_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0) !== TOTAL_DIAGNOSIS_QUESTION_COUNT) {
  throw new Error(
    `TOTAL_DIAGNOSIS_QUESTION_COUNT drift: QUESTION_DISTRIBUTION 합계 ${QUESTION_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0)}, 상수 ${TOTAL_DIAGNOSIS_QUESTION_COUNT}`
  );
}

export const SVG_CIRCLE = {
  RADIUS: 42,
  CIRCUMFERENCE: Math.round(2 * Math.PI * 42), // 264
  CENTER: 50,
  VIEWBOX: "0 0 100 100",
} as const;

export { CEFR_INFO, type CEFRInfo } from "./cefr-info";
export { ACCURACY_THRESHOLDS } from "./accuracy-thresholds";
