/**
 * 정본 vocabulary source 파일 목록과 로더.
 *
 * 이 목록은 seed-vocabulary.ts 가 읽는 source 파일과 동일해야 한다 — 파이프라인의 단일 진실.
 * (backup·merged·expansion 등 나머지 vocabularies*.json 은 legacy 이므로 정본이 아니다.)
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export const VOCAB_SOURCE_FILES = [
  "vocabularies.json",
  "vocabularies-extra-a1-a2.json",
  "vocabularies-extra-b1-b2.json",
  "vocabularies-extra-c1-c2.json",
  "vocabularies-extra-supplement.json",
  "vocabularies-extra-inline.json",
] as const;

export interface VocabSourceRecord {
  file: string;
  index: number;
  record: unknown;
}

/**
 * 정본 source 파일들을 읽어 provenance(file·index)를 붙인 평탄 배열로 반환한다.
 * source 파일 순서(=seed 적재 순서)를 보존한다 — first-wins dedup 에 필요.
 */
export function loadVocabSource(root: string): VocabSourceRecord[] {
  const out: VocabSourceRecord[] = [];
  for (const file of VOCAB_SOURCE_FILES) {
    const raw: unknown = JSON.parse(readFileSync(path.join(root, "prisma/data", file), "utf8"));
    if (!Array.isArray(raw)) {
      throw new Error(`${file} 는 JSON 배열이 아닙니다.`);
    }
    raw.forEach((record, index) => out.push({ file, index, record }));
  }
  return out;
}
