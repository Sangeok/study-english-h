/**
 * 퀴즈 generated artifact 빌드 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  prisma/data/quiz-questions.json (validate 통과 필수)
 * Output: prisma/data/generated/quiz-questions.generated.json
 * Exit:   0 성공 / 1 validate hard fail 시 artifact 미생성
 *
 * build 는 콘텐츠를 만들지 않는다 — 검증된 source 를 normalize(trim) 후 재배치할 뿐(RFC 3-1).
 * 실행: npm run content:build:quiz
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  quizQuestionSourceSchema,
  type QuizQuestionSource,
} from "@/entities/question/lib/quiz-source-schema";
import { validateQuizSource } from "./validate-quiz-source";

export type BuildQuizResult =
  | { ok: true; artifact: QuizQuestionSource[] }
  | { ok: false; errors: number; duplicates: number };

/**
 * 순수 빌드 로직 — validate 를 gate 로 통과한 레코드만 normalize 하여 artifact 를 만든다.
 * validate 실패 시 artifact 를 만들지 않는다(fail-closed).
 */
export function buildQuizArtifact(records: unknown[]): BuildQuizResult {
  const report = validateQuizSource(records);
  if (!report.passed) {
    return { ok: false, errors: report.errors.length, duplicates: report.duplicates.length };
  }

  const artifact = records.map((record) =>
    normalizeQuizRecord(quizQuestionSourceSchema.parse(record))
  );
  return { ok: true, artifact };
}

function normalizeQuizRecord(question: QuizQuestionSource): QuizQuestionSource {
  return {
    koreanHint: question.koreanHint.trim(),
    contextHintKo: question.contextHintKo?.trim(),
    englishWord: question.englishWord.trim(),
    sentence: question.sentence.trim(),
    difficulty: question.difficulty,
    category: question.category,
    // 선택지 순서는 보존한다(RFC 3-1). text 만 normalize.
    options: question.options.map((option) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
      order: option.order,
    })),
  };
}

function main(): void {
  const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
  const inputPath = path.join(root, "prisma/data/quiz-questions.json");
  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "quiz-questions.generated.json");

  const raw: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  if (!Array.isArray(raw)) {
    console.error(`❌ ${inputPath} 는 JSON 배열이 아닙니다.`);
    process.exit(1);
  }

  const result = buildQuizArtifact(raw);
  if (!result.ok) {
    console.error(
      `❌ validate 실패로 artifact 미생성 — 스키마 오류 ${result.errors}건, 중복 ${result.duplicates}건`
    );
    console.error("   먼저 확인: npm run content:validate:quiz");
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(result.artifact, null, 2)}\n`, "utf8");
  console.log(`✅ quiz artifact 생성: ${result.artifact.length}개 → ${path.relative(root, outPath)}`);
  process.exit(0);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
