/**
 * Vocabulary generated artifact 빌드 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  정본 vocab source 파일들 (validate 통과 필수)
 * Output: prisma/data/generated/vocabularies.generated.json
 * Exit:   0 성공 / 1 schema 또는 conflict hard fail 시 artifact 미생성
 *
 * complete 중복만 첫 등장 우선(first-wins) collapse 한다. conflict는 build 자체에서 차단한다.
 * build 는 콘텐츠를 만들지 않는다 — 검증된 source 를 normalize·dedupe 후 재배치할 뿐(RFC 3-1).
 * 실행: npm run content:build:vocabulary
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  vocabularySourceSchema,
  type VocabularySource,
} from "@/entities/vocabulary/lib/vocabulary-source-schema";
import { invalidateArtifact, VOCAB_ARTIFACT } from "./lib/load-artifact";
import { loadVocabSource, type VocabSourceRecord } from "./lib/vocab-source";
import { reportContentCollisions } from "./report-content-collisions";
import { validateVocabularySource } from "./validate-vocabulary-source";

export type BuildVocabResult =
  | { ok: true; artifact: VocabularySource[]; collapsed: number }
  | { ok: false; errors: number; conflicts: number };

/**
 * 순수 빌드 로직 — validate gate 통과 후 normalize + first-wins dedup 으로 artifact 를 만든다.
 */
export function buildVocabularyArtifact(records: VocabSourceRecord[]): BuildVocabResult {
  const report = validateVocabularySource(records);
  if (!report.passed) {
    return { ok: false, errors: report.errors.length, conflicts: 0 };
  }

  const collisionReport = reportContentCollisions(records);
  if (!collisionReport.passed) {
    return { ok: false, errors: 0, conflicts: collisionReport.conflicts };
  }

  const seen = new Set<string>();
  const artifact: VocabularySource[] = [];
  let collapsed = 0;

  for (const { record } of records) {
    const vocab = normalizeVocab(vocabularySourceSchema.parse(record));
    const key = vocab.word.toLowerCase(); // 대소문자 무시 기준키(RFC 3-1 normalize)
    if (seen.has(key)) {
      collapsed++; // first-wins: 이미 본 단어는 버린다(첫 등장 유지)
      continue;
    }
    seen.add(key);
    artifact.push(vocab);
  }

  return { ok: true, artifact, collapsed };
}

/** 이전 artifact를 먼저 제거하고 모든 gate를 통과한 결과만 기록한다. */
export function writeVocabularyArtifact(
  root: string,
  records: VocabSourceRecord[]
): BuildVocabResult {
  invalidateArtifact(root, VOCAB_ARTIFACT);
  const result = buildVocabularyArtifact(records);
  if (!result.ok) {
    return result;
  }

  const outPath = path.join(root, VOCAB_ARTIFACT.relPath);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(result.artifact, null, 2)}\n`, "utf8");
  return result;
}

function normalizeVocab(vocab: VocabularySource): VocabularySource {
  return {
    word: vocab.word.trim(),
    meaning: vocab.meaning.trim(),
    pronunciation: vocab.pronunciation?.trim(),
    exampleSentence: vocab.exampleSentence?.trim(),
    category: vocab.category,
    level: vocab.level,
  };
}

function main(): void {
  const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
  invalidateArtifact(root, VOCAB_ARTIFACT);
  let records: VocabSourceRecord[];
  try {
    records = loadVocabSource(root);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const result = writeVocabularyArtifact(root, records);
  if (!result.ok) {
    console.error(
      `❌ vocabulary artifact 미생성 — 스키마 오류 ${result.errors}건, conflict ${result.conflicts}건`
    );
    console.error("   먼저 확인: npm run content:validate:vocabulary && npm run content:report:collisions");
    process.exit(1);
  }

  const outPath = path.join(root, VOCAB_ARTIFACT.relPath);

  console.log(
    `✅ vocabulary artifact 생성: ${result.artifact.length}개 (중복 ${result.collapsed}개 collapse) → ${path.relative(root, outPath)}`
  );
  process.exit(0);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
