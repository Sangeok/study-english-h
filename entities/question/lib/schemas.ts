/**
 * Zod Validation Schemas for Question Entity
 *
 * API 라우트 경계에서 외부 입력을 검증하는 용도.
 * entity 타입 자체를 교체하지 않으며, 런타임 파싱 계층에서만 사용한다.
 *
 * @example
 * // app/api/diagnosis/submit/route.ts
 * import { diagnosisSubmitRequestSchema } from "@/entities/question/lib/schemas";
 * const validation = diagnosisSubmitRequestSchema.safeParse(body);
 */
import { z } from "zod";
import { TOTAL_DIAGNOSIS_QUESTION_COUNT } from "@/shared/constants";

export const questionDifficultySchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export const questionCategorySchema = z.enum(["daily", "business", "toeic", "travel", "idioms"]);

export const diagnosisAnswerSchema = z.object({
  questionId: z.string().min(1),
  // selectedText 는 빈 문자열 허용 — 미답변 문항은 서버에서 isCorrect: false 로 자연 처리.
  // .min(1) 을 붙이면 타이머 만료 자동 제출 시 400 회귀가 발생하므로 금지.
  selectedText: z.string(),
});

export const diagnosisSubmitRequestSchema = z.object({
  answers: z
    .array(diagnosisAnswerSchema)
    // 총 문항 수 고정: 일부 답변만 보내 maxPossibleScore 분모를 조작하는 exploit 차단.
    .length(TOTAL_DIAGNOSIS_QUESTION_COUNT)
    // 중복 questionId 거부: 같은 문항 × N 반복으로 가중치를 부풀리는 exploit 차단.
    .refine(
      (arr) => new Set(arr.map((a) => a.questionId)).size === arr.length,
      "Duplicate questionId"
    ),
});
