/**
 * 퀴즈 source 검증 스크립트 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  prisma/data/quiz-questions.json
 * Output: stdout 요약 + prisma/data/generated/quiz-validation.report.json
 * Exit:   0 pass / 1 hard fail (필수 필드·선택지 4개 아님·정답 1개 아님·동일 난이도 동일 englishWord 중복)
 *
 * 실행: npm run content:validate:quiz
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { quizQuestionSourceSchema } from "@/entities/question/lib/quiz-source-schema";

export interface QuizValidationError {
  index: number;
  englishWord: string | null;
  issues: { path: string; message: string }[];
}

export interface QuizDuplicate {
  difficulty: string;
  englishWord: string;
  indices: number[];
}

export interface QuizValidationReport {
  script: "validate-quiz-source";
  totalRecords: number;
  passed: boolean;
  errors: QuizValidationError[];
  duplicates: QuizDuplicate[];
}

/**
 * 순수 검증 로직 — 파일·프로세스 부작용 없이 레코드 배열만 받아 리포트를 만든다(테스트 대상).
 */
export function validateQuizSource(records: unknown[]): QuizValidationReport {
  const errors: QuizValidationError[] = [];
  const seen = new Map<string, number[]>(); // `${difficulty}::${englishWord}` -> 등장 index 들

  records.forEach((record, index) => {
    const parsed = quizQuestionSourceSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        index,
        englishWord: readEnglishWord(record),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    // 스키마를 통과한 레코드만 중복 판정에 넣는다.
    const key = `${parsed.data.difficulty}::${parsed.data.englishWord}`;
    const indices = seen.get(key) ?? [];
    indices.push(index);
    seen.set(key, indices);
  });

  const duplicates: QuizDuplicate[] = [];
  for (const [key, indices] of seen) {
    if (indices.length > 1) {
      const separator = key.indexOf("::");
      duplicates.push({
        difficulty: key.slice(0, separator),
        englishWord: key.slice(separator + 2),
        indices,
      });
    }
  }

  return {
    script: "validate-quiz-source",
    totalRecords: records.length,
    passed: errors.length === 0 && duplicates.length === 0,
    errors,
    duplicates,
  };
}

function readEnglishWord(record: unknown): string | null {
  if (record && typeof record === "object" && "englishWord" in record) {
    const word = (record as { englishWord: unknown }).englishWord;
    return typeof word === "string" ? word : null;
  }
  return null;
}

function main(): void {
  // prisma/scripts/<file> -> repo root (파일명 포함 3단계 상위)
  const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
  const inputPath = path.join(root, "prisma/data/quiz-questions.json");
  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "quiz-validation.report.json");

  const raw: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  if (!Array.isArray(raw)) {
    console.error(`❌ ${inputPath} 는 JSON 배열이 아닙니다.`);
    process.exit(1);
  }

  const report = validateQuizSource(raw);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const relReport = path.relative(root, outPath);
  console.log(`📋 quiz source 검증: ${report.totalRecords}개`);
  if (report.passed) {
    console.log(`✅ 통과 — 리포트: ${relReport}`);
    process.exit(0);
  }
  console.error(`❌ 실패 — 스키마 오류 ${report.errors.length}건, 중복 ${report.duplicates.length}건`);
  console.error(`   리포트 확인: ${relReport}`);
  process.exit(1);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
