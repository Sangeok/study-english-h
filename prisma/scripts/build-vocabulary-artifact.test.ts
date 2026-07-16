// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  buildVocabularyArtifact,
  writeVocabularyArtifact,
} from "./build-vocabulary-artifact";
import { VOCAB_ARTIFACT } from "./lib/load-artifact";
import type { VocabSourceRecord } from "./lib/vocab-source";

function rec(record: unknown, index = 0, file = "vocabularies.json"): VocabSourceRecord {
  return { file, index, record };
}

const apple = { word: "apple", meaning: "사과", pronunciation: "ˈæp.əl", category: "daily", level: "A1" };

describe("buildVocabularyArtifact", () => {
  it("검증 통과 시 ok=true 로 artifact 를 만든다", () => {
    const result = buildVocabularyArtifact([rec(apple)]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact).toHaveLength(1);
      expect(result.collapsed).toBe(0);
      expect(result.artifact[0].word).toBe("apple");
    }
  });

  it("conflict 중복 단어가 있으면 build 자체 gate에서 실패한다", () => {
    const records = [
      rec({ word: "achieve", meaning: "달성하다", category: "business", level: "A2" }, 0, "vocabularies.json"),
      rec({ word: "achieve", meaning: "달성하다", category: "toeic", level: "B1" }, 0, "vocabularies-extra-inline.json"),
    ];
    const result = buildVocabularyArtifact(records);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflicts).toBe(1);
    }
  });

  it("complete 중복은 first-wins로 collapse하고 첫 등장을 유지한다", () => {
    const records = [rec({ ...apple, word: "Apple" }), rec({ ...apple, word: "apple" }, 1)];
    const result = buildVocabularyArtifact(records);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact).toHaveLength(1);
      expect(result.collapsed).toBe(1);
      expect(result.artifact[0].word).toBe("Apple");
    }
  });

  it("문자열 필드를 trim 으로 normalize 한다", () => {
    const result = buildVocabularyArtifact([rec({ ...apple, word: "  apple  ", meaning: "  사과  " })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact[0].word).toBe("apple");
      expect(result.artifact[0].meaning).toBe("사과");
    }
  });

  it("validate 실패 시 ok=false, artifact 미생성(fail-closed)", () => {
    const result = buildVocabularyArtifact([rec({ ...apple, category: "idioms" })]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toBeGreaterThan(0);
    }
  });

  it("hard fail이면 미리 존재하던 stale vocabulary artifact를 제거한다", () => {
    const root = mkdtempSync(path.join(tmpdir(), "study-eng-vocab-build-"));
    const artifactPath = path.join(root, VOCAB_ARTIFACT.relPath);
    mkdirSync(path.dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, "stale", "utf8");

    try {
      const result = writeVocabularyArtifact(root, [
        rec({ word: "run", meaning: "달리다", category: "daily", level: "A1" }),
        rec({ word: "run", meaning: "운영하다", category: "business", level: "B1" }, 1),
      ]);

      expect(result.ok).toBe(false);
      expect(existsSync(artifactPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
