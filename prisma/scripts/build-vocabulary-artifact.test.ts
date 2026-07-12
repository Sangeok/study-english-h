// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildVocabularyArtifact } from "./build-vocabulary-artifact";
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

  it("중복 단어는 first-wins 로 collapse — 첫 등장(순서상 먼저)을 유지", () => {
    const records = [
      rec({ word: "achieve", meaning: "달성하다", category: "business", level: "A2" }, 0, "vocabularies.json"),
      rec({ word: "achieve", meaning: "달성하다", category: "toeic", level: "B1" }, 0, "vocabularies-extra-inline.json"),
    ];
    const result = buildVocabularyArtifact(records);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact).toHaveLength(1);
      expect(result.collapsed).toBe(1);
      expect(result.artifact[0].category).toBe("business"); // 첫 등장 유지
      expect(result.artifact[0].level).toBe("A2");
    }
  });

  it("대소문자만 다른 단어도 같은 기준키로 collapse", () => {
    const records = [rec({ ...apple, word: "Apple" }), rec({ ...apple, word: "apple" }, 1)];
    const result = buildVocabularyArtifact(records);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact).toHaveLength(1);
      expect(result.collapsed).toBe(1);
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
});
