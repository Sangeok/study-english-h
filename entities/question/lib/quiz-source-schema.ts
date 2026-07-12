/**
 * 퀴즈 source(`prisma/data/quiz-questions.json`)의 형상 스키마.
 *
 * 런타임 wire 타입(정답·isCorrect 제거)과 달리, 정답을 포함한 원천 레코드 전체를 검증한다.
 * validate/build 스크립트(`prisma/scripts/*`)가 이 단일 정의를 재사용한다 — 런타임과의 drift 방지.
 * CEFR·카테고리 enum 은 기존 공용 정의를 재사용한다(하드코딩 금지).
 */
import { z } from "zod";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import { questionCategorySchema } from "./schemas";

// 공백만 있는 문자열도 "빈 값"으로 본다. validate 단계는 값을 변형하지 않으므로 trim 대신 refine 으로 검사.
const nonBlank = z.string().refine((s) => s.trim().length > 0, "빈 문자열은 허용되지 않습니다");

export const quizOptionSourceSchema = z.object({
  text: nonBlank,
  isCorrect: z.boolean(),
  order: z.number().int(),
});

export const quizQuestionSourceSchema = z.object({
  koreanHint: nonBlank,
  // Prisma `contextHintKo` 는 String?(선택). 현재 데이터엔 모두 존재하나 스키마상 optional 을 유지한다.
  contextHintKo: nonBlank.optional(),
  englishWord: nonBlank,
  sentence: nonBlank,
  difficulty: cefrLevelSchema,
  category: questionCategorySchema,
  options: z
    .array(quizOptionSourceSchema)
    .length(4, "선택지는 정확히 4개여야 합니다")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, "정답 선택지는 정확히 1개여야 합니다"),
});

export type QuizQuestionSource = z.infer<typeof quizQuestionSourceSchema>;
