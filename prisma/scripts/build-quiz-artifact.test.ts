// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { buildQuizArtifact, writeQuizArtifact } from "./build-quiz-artifact";
import { QUIZ_ARTIFACT } from "./lib/load-artifact";

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

describe("buildQuizArtifact", () => {
  it("검증 통과 시 ok=true 로 artifact 를 만든다", () => {
    const result = buildQuizArtifact([validRecord]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact).toHaveLength(1);
      expect(result.artifact[0].englishWord).toBe("apple");
    }
  });

  it("문자열 필드를 trim 으로 normalize 한다", () => {
    const untrimmed = {
      ...validRecord,
      englishWord: "  apple  ",
      sentence: "  I ate an _____ for breakfast.  ",
      options: [
        { text: "  apple  ", isCorrect: true, order: 1 },
        { text: "chair", isCorrect: false, order: 2 },
        { text: "pencil", isCorrect: false, order: 3 },
        { text: "table", isCorrect: false, order: 4 },
      ],
    };
    const result = buildQuizArtifact([untrimmed]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact[0].englishWord).toBe("apple");
      expect(result.artifact[0].sentence).toBe("I ate an _____ for breakfast.");
      expect(result.artifact[0].options[0].text).toBe("apple");
    }
  });

  it("선택지 순서를 보존한다", () => {
    const result = buildQuizArtifact([validRecord]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact[0].options.map((o) => o.order)).toEqual([1, 2, 3, 4]);
    }
  });

  it("validate 실패 시 ok=false, artifact 를 만들지 않는다(fail-closed)", () => {
    const invalid = { ...validRecord, options: validRecord.options.slice(0, 3) };
    const result = buildQuizArtifact([invalid]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toBeGreaterThan(0);
    }
  });

  it("중복(동일 난이도 동일 englishWord)이 있으면 ok=false", () => {
    const result = buildQuizArtifact([validRecord, { ...validRecord }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.duplicates).toBeGreaterThan(0);
    }
  });

  it("hard fail이면 미리 존재하던 stale quiz artifact를 제거한다", () => {
    const root = mkdtempSync(path.join(tmpdir(), "study-eng-quiz-build-"));
    const artifactPath = path.join(root, QUIZ_ARTIFACT.relPath);
    mkdirSync(path.dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, "stale", "utf8");

    try {
      const result = writeQuizArtifact(root, [
        { ...validRecord, options: validRecord.options.slice(0, 3) },
      ]);

      expect(result.ok).toBe(false);
      expect(existsSync(artifactPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
