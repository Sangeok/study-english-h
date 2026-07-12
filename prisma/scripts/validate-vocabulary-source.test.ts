// @vitest-environment node
import { describe, it, expect } from "vitest";
import { validateVocabularySource } from "./validate-vocabulary-source";
import type { VocabSourceRecord } from "./lib/vocab-source";

function rec(record: unknown, index = 0, file = "vocabularies.json"): VocabSourceRecord {
  return { file, index, record };
}

const valid = {
  word: "apple",
  meaning: "사과",
  pronunciation: "ˈæp.əl",
  exampleSentence: "I ate an apple.",
  category: "daily",
  level: "A1",
};

describe("validateVocabularySource", () => {
  it("유효한 레코드는 passed=true", () => {
    const report = validateVocabularySource([rec(valid)]);
    expect(report.passed).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.totalRecords).toBe(1);
  });

  it("pronunciation·exampleSentence 는 선택 — 없어도 통과", () => {
    const report = validateVocabularySource([rec({ word: "run", meaning: "달리다", category: "daily", level: "A1" })]);
    expect(report.passed).toBe(true);
  });

  it("필수 필드(meaning) 빈 문자열은 hard fail", () => {
    const report = validateVocabularySource([rec({ ...valid, meaning: "  " })]);
    expect(report.passed).toBe(false);
    expect(report.errors[0].word).toBe("apple");
  });

  it("vocab 카테고리는 idioms 를 허용하지 않는다(quiz 전용) — hard fail", () => {
    const report = validateVocabularySource([rec({ ...valid, category: "idioms" })]);
    expect(report.passed).toBe(false);
  });

  it("level CEFR 위반은 hard fail", () => {
    const report = validateVocabularySource([rec({ ...valid, level: "Z9" })]);
    expect(report.passed).toBe(false);
  });

  it("에러에 provenance(file·index)를 보존한다", () => {
    const report = validateVocabularySource([rec({ ...valid, word: "" }, 7, "vocabularies-extra-inline.json")]);
    expect(report.passed).toBe(false);
    expect(report.errors[0].file).toBe("vocabularies-extra-inline.json");
    expect(report.errors[0].index).toBe(7);
  });
});
