/**
 * Zod Validation Schemas for Question Entity
 *
 * API 라우트 경계에서 외부 입력을 검증하는 용도.
 * entity 타입 자체를 교체하지 않으며, 런타임 파싱 계층에서만 사용한다.
 *
 * @example
 * // app/api/diagnosis/submit/route.ts
 * import { diagnosisAnswerSchema } from "@/entities/question/lib/schemas";
 * const validation = z.array(diagnosisAnswerSchema).safeParse(body.answers);
 */
import { z } from "zod";

export const questionDifficultySchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export const questionCategorySchema = z.enum(["daily", "business", "toeic", "travel", "idioms"]);

export const diagnosisAnswerSchema = z.object({
  questionId: z.string().min(1),
  difficulty: questionDifficultySchema,
  isCorrect: z.boolean(),
  category: questionCategorySchema,
});
