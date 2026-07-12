// @vitest-environment node
import { describe, it, expect } from "vitest";
import { reportContentCoverage } from "./report-content-coverage";

describe("reportContentCoverage", () => {
  it("quiz 단어의 vocab 겹침 비율을 계산한다", () => {
    const quiz = [
      { englishWord: "apple", category: "daily" },
      { englishWord: "run", category: "daily" },
    ];
    const vocab = [{ word: "apple", category: "daily" }];
    const report = reportContentCoverage(quiz, vocab);
    expect(report.quiz.uniqueWords).toBe(2);
    expect(report.overlap.sharedWords).toBe(1);
    expect(report.overlap.quizCoverageRatio).toBe(0.5);
  });

  it("quiz 전용 카테고리(idioms)를 분리한다", () => {
    const quiz = [
      { englishWord: "apple", category: "daily" },
      { englishWord: "kick the bucket", category: "idioms" },
    ];
    const vocab = [{ word: "apple", category: "daily" }];
    const report = reportContentCoverage(quiz, vocab);
    expect(report.quizOnlyCategories).toEqual(["idioms"]);
    expect(report.vocabularyOnlyCategories).toEqual([]);
  });

  it("카테고리별 분포를 집계한다", () => {
    const quiz = [
      { englishWord: "a", category: "daily" },
      { englishWord: "b", category: "daily" },
      { englishWord: "c", category: "business" },
    ];
    const report = reportContentCoverage(quiz, []);
    expect(report.quiz.byCategory).toEqual({ daily: 2, business: 1 });
  });

  it("겹침 비교는 대소문자를 무시한다", () => {
    const report = reportContentCoverage([{ englishWord: "Apple", category: "daily" }], [{ word: "apple", category: "daily" }]);
    expect(report.overlap.sharedWords).toBe(1);
  });

  it("quiz 가 비어도 안전하게 0 을 반환한다", () => {
    const report = reportContentCoverage([], [{ word: "apple", category: "daily" }]);
    expect(report.overlap.quizCoverageRatio).toBe(0);
    expect(report.overlap.sharedWords).toBe(0);
  });
});
