/**
 * Vocabulary 충돌/중복 리포트 (콘텐츠 파이프라인 Phase 2).
 *
 * Input:  정본 vocab source 파일들
 * Output: prisma/data/generated/content-collisions.report.json
 * Exit:   0 (warning만) — 중복을 조용히 버리지 않고 드러내는 것이 목적(RFC 1절).
 *
 * 정규화 후 동일 단어를 분류한다:
 *   - complete: 의미·레벨·카테고리까지 동일한 완전 중복 (build 단계에서 collapse)
 *   - conflict: 같은 단어가 레벨/카테고리/의미에서 갈라짐 (수동 큐레이션 후보)
 * build-vocabulary 는 first-wins 로 collapse 하므로, 이 리포트가 유일한 가시화 지점이다.
 * 실행: npm run content:report:collisions
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadVocabSource, type VocabSourceRecord } from "./lib/vocab-source";

export interface CollisionOccurrence {
  file: string;
  index: number;
  level: string;
  category: string;
  meaning: string;
}

export interface Collision {
  word: string;
  type: "complete" | "conflict";
  occurrences: CollisionOccurrence[];
}

export interface CollisionReport {
  script: "report-content-collisions";
  totalRecords: number;
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
    uniqueWords: groups.size,
    duplicateWords: collisions.length,
    completeDuplicates,
    conflicts,
    collisions,
  };
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
  const records = loadVocabSource(root);
  const report = reportContentCollisions(records);

  const outDir = path.join(root, "prisma/data/generated");
  const outPath = path.join(outDir, "content-collisions.report.json");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `📋 vocab 충돌 리포트: ${report.totalRecords}개 중 유니크 ${report.uniqueWords}, 중복단어 ${report.duplicateWords}`
  );
  console.log(
    `   ⚠️  충돌(conflict) ${report.conflicts} · 완전중복(complete) ${report.completeDuplicates} → ${path.relative(root, outPath)}`
  );
  // 중복은 warning 이다 — build 가 first-wins 로 처리하므로 exit 0.
  process.exit(0);
}

// tsx 로 직접 실행될 때만 main 실행. import(테스트) 시에는 순수 함수만 노출.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
