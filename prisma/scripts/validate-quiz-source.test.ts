// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { QUIZ_ARTIFACT } from "./lib/load-artifact";
import { validateQuizSource, writeQuizValidationReport } from "./validate-quiz-source";

const validRecord = {
  koreanHint: "사과",
  contextHintKo: "아침에 과일을 먹는 상황입니다.",
  englishWord: "apple",
  sentence: "I ate an _____ for breakfast.",
  difficulty: "A1",
  category: "daily",
  options: [
    { text: "apple", isCorrect: true, order: 1 },
    { text: "chair", isCorrect: false, order: 2 },
    { text: "pencil", isCorrect: false, order: 3 },
    { text: "table", isCorrect: false, order: 4 },
  ],
};

describe("validateQuizSource", () => {
  it("유효한 레코드는 passed=true, 오류·중복 없음", () => {
    const report = validateQuizSource([validRecord]);
    expect(report.passed).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.duplicates).toEqual([]);
    expect(report.totalRecords).toBe(1);
  });

  it("선택지가 4개가 아니면 hard fail", () => {
    const report = validateQuizSource([{ ...validRecord, options: validRecord.options.slice(0, 3) }]);
    expect(report.passed).toBe(false);
    expect(report.errors[0].issues.some((i) => i.path.startsWith("options"))).toBe(true);
  });

  it("정답 선택지가 1개가 아니면 hard fail", () => {
    const twoCorrect = validRecord.options.map((option, i) => ({ ...option, isCorrect: i < 2 }));
    const report = validateQuizSource([{ ...validRecord, options: twoCorrect }]);
    expect(report.passed).toBe(false);
  });

  it("필수 필드 빈 문자열은 hard fail — 원본 값을 그대로 보고", () => {
    const report = validateQuizSource([{ ...validRecord, englishWord: "  " }]);
    expect(report.passed).toBe(false);
    expect(report.errors[0].englishWord).toBe("  ");
  });

  it("category enum 위반은 hard fail", () => {
    const report = validateQuizSource([{ ...validRecord, category: "unknown" }]);
    expect(report.passed).toBe(false);
  });

  it("difficulty CEFR 위반은 hard fail", () => {
    const report = validateQuizSource([{ ...validRecord, difficulty: "Z9" }]);
    expect(report.passed).toBe(false);
  });

  it("동일 난이도 동일 englishWord 중복은 hard fail(duplicates 보고)", () => {
    const report = validateQuizSource([validRecord, { ...validRecord }]);
    expect(report.passed).toBe(false);
    expect(report.duplicates).toEqual([{ difficulty: "A1", englishWord: "apple", indices: [0, 1] }]);
  });

  it("build와 동일하게 trim한 englishWord 기준으로 중복을 차단한다", () => {
    const report = validateQuizSource([
      validRecord,
      { ...validRecord, englishWord: ` ${validRecord.englishWord} ` },
    ]);

    expect(report.passed).toBe(false);
    expect(report.duplicates).toEqual([
      { difficulty: "A1", englishWord: "apple", indices: [0, 1] },
    ]);
  });

  it("난이도가 다르면 같은 englishWord 여도 중복 아님", () => {
    const report = validateQuizSource([validRecord, { ...validRecord, difficulty: "B1" }]);
    expect(report.passed).toBe(true);
    expect(report.duplicates).toEqual([]);
  });

  it("contextHintKo 는 선택 필드 — 없어도 통과", () => {
    const withoutContext = { ...validRecord } as Record<string, unknown>;
    delete withoutContext.contextHintKo;
    const report = validateQuizSource([withoutContext]);
    expect(report.passed).toBe(true);
  });

  it("hard fail report를 기록하고 stale quiz artifact를 제거한다", () => {
    const root = mkdtempSync(path.join(tmpdir(), "study-eng-quiz-validation-"));
    const artifactPath = path.join(root, QUIZ_ARTIFACT.relPath);
    mkdirSync(path.dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, "stale", "utf8");

    try {
      const report = writeQuizValidationReport(root, [
        { ...validRecord, options: validRecord.options.slice(0, 3) },
      ]);

      expect(report.passed).toBe(false);
      expect(existsSync(artifactPath)).toBe(false);
      expect(
        existsSync(path.join(root, "prisma/data/generated/quiz-validation.report.json"))
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
