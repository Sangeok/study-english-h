/**
 * quiz-vocabulary 커버리지 리포트 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  quiz source + 정본 vocab source
 * Output: prisma/data/generated/content-coverage.report.json
 * Exit:   0 (항상) — 수치 변동은 warning, hard fail 아님(RFC 6절).
 *
 * quiz 단어와 vocab 단어의 겹침, 카테고리별 분포, quiz 전용 카테고리(idioms)를 분리해 보고한다.
 * 실행: npm run content:report:coverage
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadVocabSource } from "./lib/vocab-source";

export interface CoverageReport {
  script: "report-content-coverage";
  quiz: { totalQuestions: number; uniqueWords: number; byCategory: Record<string, number> };
  vocabulary: { totalRecords: number; uniqueWords: number; byCategory: Record<string, number> };
  overlap: { sharedWords: number; quizCoverageRatio: number };
  quizOnlyCategories: string[];
  vocabularyOnlyCategories: string[];
}

/**
 * 순수 리포트 로직 — quiz/vocab 레코드 배열을 받아 커버리지 수치를 계산한다(테스트 대상).
 */
export function reportContentCoverage(
  quizRecords: unknown[],
  vocabRecords: unknown[]
): CoverageReport {
  const quizWords = new Set<string>();
  const quizByCategory: Record<string, number> = {};
  for (const record of quizRecords) {
    const word = readField(record, "englishWord").toLowerCase().trim();
    if (word) quizWords.add(word);
    tally(quizByCategory, readField(record, "category"));
  }

  const vocabWords = new Set<string>();
  const vocabByCategory: Record<string, number> = {};
  for (const record of vocabRecords) {
    const word = readField(record, "word").toLowerCase().trim();
    if (word) vocabWords.add(word);
    tally(vocabByCategory, readField(record, "category"));
  }

  let sharedWords = 0;
  for (const word of quizWords) {
    if (vocabWords.has(word)) sharedWords++;
  }
  const quizCoverageRatio =
    quizWords.size > 0 ? Math.round((sharedWords / quizWords.size) * 10000) / 10000 : 0;

  const quizCategories = Object.keys(quizByCategory);
  const vocabCategories = Object.keys(vocabByCategory);

  return {
    script: "report-content-coverage",
    quiz: {
      totalQuestions: quizRecords.length,
      uniqueWords: quizWords.size,
      byCategory: quizByCategory,
    },
    vocabulary: {
      totalRecords: vocabRecords.length,
      uniqueWords: vocabWords.size,
      byCategory: vocabByCategory,
    },
    overlap: { sharedWords, quizCoverageRatio },
    quizOnlyCategories: quizCategories.filter((c) => !vocabCategories.includes(c)).sort(),
    vocabularyOnlyCategories: vocabCategories.filter((c) => !quizCategories.includes(c)).sort(),
  };
}

function tally(bucket: Record<string, number>, category: string): void {
  if (!category) return;
  bucket[category] = (bucket[category] ?? 0) + 1;
}

function readField(record: unknown, key: string): string {
  if (record && typeof record === "object" && key in record) {
    const value = (record as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }
  return "";
}

function main(): void {
  const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
  const quizRaw: unknown = JSON.parse(
    readFileSync(path.join(root, "prisma/data/quiz-questions.json"), "utf8")
  );
  const quizRecords = Array.isArray(quizRaw) ? quizRaw : [];
  const vocabRecords = loadVocabSource(root).map((r) => r.record);

  const report = reportContentCoverage(quizRecords, vocabRecords);

  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "content-coverage.report.json");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const pct = (report.overlap.quizCoverageRatio * 100).toFixed(1);
  console.log(
    `📋 커버리지 리포트: quiz 단어 ${report.quiz.uniqueWords} 중 ${report.overlap.sharedWords}개가 vocab 에 존재(${pct}%)`
  );
  console.log(`   quiz 전용 카테고리: ${report.quizOnlyCategories.join(", ") || "(없음)"} → ${path.relative(root, outPath)}`);
  process.exit(0);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
