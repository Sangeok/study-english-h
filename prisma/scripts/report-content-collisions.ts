/**
 * Vocabulary 충돌/중복 리포트 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  정본 vocab source 파일들
 * Output: prisma/data/generated/content-collisions.report.json
 * Exit:   0 complete-only / 1 conflict hard fail
 *
 * 정규화 후 동일 단어를 분류한다:
 *   - complete: 의미·레벨·카테고리까지 동일한 완전 중복 (build 단계에서 collapse)
 *   - conflict: 같은 단어가 레벨/카테고리/의미에서 갈라짐 (수동 큐레이션 후보)
 * 실행: npm run content:report:collisions
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { invalidateArtifact, VOCAB_ARTIFACT } from "./lib/load-artifact";
import { loadVocabSource, type VocabSourceRecord } from "./lib/vocab-source";

export interface CollisionOccurrence {
  file: string;
  index: number;
  level: string;
  category: string;
  meaning: string;
  /** complete 판정에서 제외되는 예문·발음 차이까지 검토할 수 있는 원본 레코드. */
  record: unknown;
}

export interface Collision {
  word: string;
  type: "complete" | "conflict";
  occurrences: CollisionOccurrence[];
}

export interface CollisionReport {
  script: "report-content-collisions";
  totalRecords: number;
  passed: boolean;
  uniqueWords: number;
  duplicateWords: number;
  completeDuplicates: number;
  conflicts: number;
  collisions: Collision[];
}

/**
 * 순수 리포트 로직 — 정규화 단어 기준으로 그룹화하고 complete/conflict 로 분류한다(테스트 대상).
 */
export function reportContentCollisions(records: VocabSourceRecord[]): CollisionReport {
  const groups = new Map<string, CollisionOccurrence[]>();

  for (const { file, index, record } of records) {
    const key = readField(record, "word").toLowerCase().trim();
    if (!key) continue;
    const occurrence: CollisionOccurrence = {
      file,
      index,
      level: readField(record, "level"),
      category: readField(record, "category"),
      meaning: readField(record, "meaning").trim(),
      record,
    };
    const list = groups.get(key) ?? [];
    list.push(occurrence);
    groups.set(key, list);
  }

  const collisions: Collision[] = [];
  for (const [word, occurrences] of groups) {
    if (occurrences.length < 2) continue;
    const signatures = new Set(
      occurrences.map((o) => `${o.meaning}::${o.level}::${o.category}`)
    );
    collisions.push({
      word,
      type: signatures.size === 1 ? "complete" : "conflict",
      occurrences,
    });
  }

  // conflict 를 먼저, 그 안에서 단어 알파벳순으로 안정 정렬.
  collisions.sort((a, b) => {
    if (a.type !== b.type) return a.type === "conflict" ? -1 : 1;
    return a.word.localeCompare(b.word);
  });

  const completeDuplicates = collisions.filter((c) => c.type === "complete").length;
  const conflicts = collisions.filter((c) => c.type === "conflict").length;

  return {
    script: "report-content-collisions",
    totalRecords: records.length,
    passed: conflicts === 0,
    uniqueWords: groups.size,
    duplicateWords: collisions.length,
    completeDuplicates,
    conflicts,
    collisions,
  };
}

/** 리포트를 항상 기록하고 conflict가 있으면 seed용 artifact를 무효화한다. */
export function writeContentCollisionReport(
  root: string,
  records: VocabSourceRecord[]
): CollisionReport {
  const report = reportContentCollisions(records);
  if (!report.passed) {
    invalidateArtifact(root, VOCAB_ARTIFACT);
  }
  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "content-collisions.report.json");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return report;
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
  let records: VocabSourceRecord[];
  try {
    records = loadVocabSource(root);
  } catch (error) {
    invalidateArtifact(root, VOCAB_ARTIFACT);
    console.error(error);
    process.exit(1);
  }
  const report = writeContentCollisionReport(root, records);
  const outPath = path.join(root, "prisma/data/generated/content-collisions.report.json");

  console.log(
    `📋 vocab 충돌 리포트: ${report.totalRecords}개 중 유니크 ${report.uniqueWords}, 중복단어 ${report.duplicateWords}`
  );
  console.log(
    `   ⚠️  충돌(conflict) ${report.conflicts} · 완전중복(complete) ${report.completeDuplicates} → ${path.relative(root, outPath)}`
  );
  if (!report.passed) {
    console.error("❌ conflict가 남아 있어 vocabulary pipeline을 중단합니다.");
    process.exit(1);
  }
  process.exit(0);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
