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

// vocab 카테고리 — quiz 와 동일한 5종.
// idioms 는 원래 quiz 전용이었으나(RFC 6절 category 분리) ADR 0002 결정 3 이 뒤집었다:
// 관용구가 사전에 없으면 퀴즈에서 틀려도 복습 큐에 안 들어가고 결과 화면의 "N개 추가" 숫자가 어긋난다.
export const vocabularyCategorySchema = z.enum(["daily", "business", "toeic", "travel", "idioms"]);

export const vocabularySourceSchema = z.object({
  word: nonBlank,
  meaning: nonBlank,
  pronunciation: nonBlank.optional(),
  exampleSentence: nonBlank.optional(),
  category: vocabularyCategorySchema,
  level: cefrLevelSchema,
});

export type VocabularySource = z.infer<typeof vocabularySourceSchema>;
