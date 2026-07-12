/**
 * Vocabulary source 검증 스크립트 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  정본 vocab source 파일들(prisma/scripts/lib/vocab-source.ts)
 * Output: stdout 요약 + prisma/data/generated/vocabularies-validation.report.json
 * Exit:   0 pass / 1 hard fail (schema 위반·필수 필드 누락·enum 오류)
 *
 * 레코드 단위 스키마 검증만 한다. 단어 중복/충돌은 report-content-collisions 의 역할.
 * 실행: npm run content:validate:vocabulary
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { vocabularySourceSchema } from "@/entities/vocabulary/lib/vocabulary-source-schema";
import { loadVocabSource, type VocabSourceRecord } from "./lib/vocab-source";

export interface VocabValidationError {
  file: string;
  index: number;
  word: string | null;
  issues: { path: string; message: string }[];
}

export interface VocabValidationReport {
  script: "validate-vocabulary-source";
  totalRecords: number;
  passed: boolean;
  errors: VocabValidationError[];
}

/**
 * 순수 검증 로직 — provenance 가 붙은 레코드 배열을 받아 레코드별 스키마 위반을 모은다(테스트 대상).
 */
export function validateVocabularySource(records: VocabSourceRecord[]): VocabValidationReport {
  const errors: VocabValidationError[] = [];

  for (const { file, index, record } of records) {
    const parsed = vocabularySourceSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        file,
        index,
        word: readWord(record),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
  }

  return {
    script: "validate-vocabulary-source",
    totalRecords: records.length,
    passed: errors.length === 0,
    errors,
  };
}

function readWord(record: unknown): string | null {
  if (record && typeof record === "object" && "word" in record) {
    const word = (record as { word: unknown }).word;
    return typeof word === "string" ? word : null;
  }
  return null;
}

function main(): void {
  const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
  const records = loadVocabSource(root);
  const report = validateVocabularySource(records);

  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "vocabularies-validation.report.json");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const relReport = path.relative(root, outPath);
  console.log(`📋 vocabulary source 검증: ${report.totalRecords}개`);
  if (report.passed) {
    console.log(`✅ 통과 — 리포트: ${relReport}`);
    process.exit(0);
  }
  console.error(`❌ 실패 — 스키마 오류 ${report.errors.length}건`);
  console.error(`   리포트 확인: ${relReport}`);
  process.exit(1);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
