// @vitest-environment node
import { describe, it, expect } from "vitest";
import { reportContentCollisions } from "./report-content-collisions";
import type { VocabSourceRecord } from "./lib/vocab-source";

function rec(record: unknown, index = 0, file = "vocabularies.json"): VocabSourceRecord {
  return { file, index, record };
}

describe("reportContentCollisions", () => {
  it("중복 없으면 collisions 빈 배열", () => {
    const report = reportContentCollisions([
      rec({ word: "apple", meaning: "사과", level: "A1", category: "daily" }),
      rec({ word: "banana", meaning: "바나나", level: "A1", category: "daily" }),
    ]);
    expect(report.duplicateWords).toBe(0);
    expect(report.uniqueWords).toBe(2);
    expect(report.collisions).toEqual([]);
  });

  it("의미·레벨·카테고리 동일 중복은 complete 로 분류", () => {
    const report = reportContentCollisions([
      rec({ word: "apple", meaning: "사과", level: "A1", category: "daily" }, 0, "vocabularies.json"),
      rec({ word: "apple", meaning: "사과", level: "A1", category: "daily" }, 3, "vocabularies-extra-a1-a2.json"),
    ]);
    expect(report.completeDuplicates).toBe(1);
    expect(report.conflicts).toBe(0);
    expect(report.collisions[0].type).toBe("complete");
    expect(report.collisions[0].occurrences).toHaveLength(2);
  });

  it("레벨/카테고리가 갈라지면 conflict 로 분류", () => {
    const report = reportContentCollisions([
      rec({ word: "achieve", meaning: "달성하다", level: "A2", category: "business" }),
      rec({ word: "achieve", meaning: "달성하다", level: "B1", category: "toeic" }),
    ]);
    expect(report.conflicts).toBe(1);
    expect(report.completeDuplicates).toBe(0);
    expect(report.collisions[0].type).toBe("conflict");
  });

  it("대소문자만 다른 단어도 같은 기준키로 묶는다", () => {
    const report = reportContentCollisions([
      rec({ word: "Apple", meaning: "사과", level: "A1", category: "daily" }),
      rec({ word: "apple", meaning: "사과", level: "A1", category: "daily" }, 1),
    ]);
    expect(report.duplicateWords).toBe(1);
  });

  it("occurrences 에 provenance(file·index)를 보존한다", () => {
    const report = reportContentCollisions([
      rec({ word: "run", meaning: "달리다", level: "A1", category: "daily" }, 5, "vocabularies.json"),
      rec({ word: "run", meaning: "운영하다", level: "B1", category: "business" }, 2, "vocabularies-extra-inline.json"),
    ]);
    expect(report.collisions[0].occurrences.map((o) => o.file)).toEqual([
      "vocabularies.json",
      "vocabularies-extra-inline.json",
    ]);
    expect(report.collisions[0].occurrences.map((o) => o.index)).toEqual([5, 2]);
  });
});
