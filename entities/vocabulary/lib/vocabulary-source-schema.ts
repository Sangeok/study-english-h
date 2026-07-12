/**
 * Vocabulary source(`prisma/data/vocabularies*.json`)의 형상 스키마.
 *
 * validate/build 스크립트(`prisma/scripts/*`)가 이 단일 정의를 재사용한다.
 * CEFR 레벨은 공용 cefrLevelSchema 를 재사용하고, 카테고리는 vocab 도메인 값(idioms 제외 — quiz 전용)만 허용한다.
 * audioUrl·exampleAudioUrl 은 seed 이후 TTS 배치가 채우므로 source 스키마엔 포함하지 않는다.
 */
import { z } from "zod";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";

const nonBlank = z.string().refine((s) => s.trim().length > 0, "빈 문자열은 허용되지 않습니다");

// vocab 카테고리 — 공통 4종. idioms 는 quiz 전용이라 제외(RFC 6절 category 분리).
export const vocabularyCategorySchema = z.enum(["daily", "business", "toeic", "travel"]);

export const vocabularySourceSchema = z.object({
  word: nonBlank,
  meaning: nonBlank,
  pronunciation: nonBlank.optional(),
  exampleSentence: nonBlank.optional(),
  category: vocabularyCategorySchema,
  level: cefrLevelSchema,
});

export type VocabularySource = z.infer<typeof vocabularySourceSchema>;
