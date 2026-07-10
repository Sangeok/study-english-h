import { describe, it, expect } from "vitest";
import { fillBlank } from "./fill-blank";

describe("fillBlank", () => {
  it("빈칸을 정답으로 치환한다", () => {
    // Tier A (no-computation): 결정적 문자열 치환
    expect(fillBlank("The _____ purred softly on my lap.", "cat")).toBe(
      "The cat purred softly on my lap."
    );
  });

  it("문두 빈칸도 정답의 대소문자를 그대로 반영한다", () => {
    // Tier A: correctOption.text의 대소문자를 보존(englishWord 소문자 문제 회피)
    expect(fillBlank("_____ for helping me!", "Thank you")).toBe(
      "Thank you for helping me!"
    );
  });

  it("정답이 없으면 원문을 그대로 반환한다", () => {
    // Tier A: 가드 `if (!answer) return sentence`에서 직접 도출
    expect(fillBlank("The _____ purred.", undefined)).toBe("The _____ purred.");
  });
});
