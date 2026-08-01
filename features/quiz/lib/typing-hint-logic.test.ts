// @vitest-environment node
/**
 * 타이핑 힌트 사다리 — 접힘 처리의 회귀.
 *
 * 예문 빈칸이 없는 문항(실측 123건, 7.9%)은 사다리가 1단계로 접히고, 그 한 단계가
 * 철자 발판이 된다. 접힘을 반영 안 하면 마지막 도움이 도달 불가능해진다.
 *
 * 그리고 **버튼 표시 술어를 따로 단언한다** — P2-1 에서 훅만 고치고 이 술어를 놓치면
 * 훅이 2단계를 허용해도 버튼이 사라져 사용자가 요청할 방법이 없어지는 결함을 겪었다.
 * 훅 테스트만으로는 거짓 초록이 된다.
 */
import { describe, expect, it } from "vitest";
import {
  canRequestMoreTypingHints,
  getTypingHintButtonLabel,
  getTypingMaxHintLevel,
  shouldShowBlankedSentence,
  shouldShowFirstLetter,
} from "./typing-hint-logic";

const WITH_SENTENCE = true;
const WITHOUT_SENTENCE = false;

describe("getTypingMaxHintLevel", () => {
  it("예문이 있으면 2단계, 없으면 1단계로 접힌다", () => {
    expect(getTypingMaxHintLevel(WITH_SENTENCE)).toBe(2);
    expect(getTypingMaxHintLevel(WITHOUT_SENTENCE)).toBe(1);
  });
});

describe("예문이 있는 문항 — 2단계 사다리", () => {
  it("1단계는 예문만, 철자는 안 준다", () => {
    expect(shouldShowBlankedSentence(1, WITH_SENTENCE)).toBe(true);
    expect(shouldShowFirstLetter(1, WITH_SENTENCE)).toBe(false);
  });

  it("2단계에서 첫 글자가 열린다", () => {
    expect(shouldShowFirstLetter(2, WITH_SENTENCE)).toBe(true);
  });

  it("0단계는 아무것도 열지 않는다", () => {
    expect(shouldShowBlankedSentence(0, WITH_SENTENCE)).toBe(false);
    expect(shouldShowFirstLetter(0, WITH_SENTENCE)).toBe(false);
  });
});

describe("예문이 없는 문항 — 1단계로 접힘", () => {
  it("예문은 어떤 단계에서도 안 열린다", () => {
    expect(shouldShowBlankedSentence(1, WITHOUT_SENTENCE)).toBe(false);
    expect(shouldShowBlankedSentence(2, WITHOUT_SENTENCE)).toBe(false);
  });

  it("첫 글자가 1단계로 당겨진다 — 마지막 도움이 도달 불가능해지면 안 된다", () => {
    expect(shouldShowFirstLetter(1, WITHOUT_SENTENCE)).toBe(true);
  });
});

describe("canRequestMoreTypingHints — 버튼 표시 술어", () => {
  it("예문이 있으면 1단계에서도 버튼이 남는다", () => {
    // 여기가 false 면 버튼이 사라져 2단계(첫 글자)에 영원히 도달하지 못한다.
    expect(canRequestMoreTypingHints(1, WITH_SENTENCE)).toBe(true);
  });

  it("예문이 없으면 1단계에서 버튼이 사라진다 — 더 줄 게 없다", () => {
    expect(canRequestMoreTypingHints(1, WITHOUT_SENTENCE)).toBe(false);
  });

  it("0단계에선 항상 버튼이 있고, 최대 단계에선 항상 없다", () => {
    expect(canRequestMoreTypingHints(0, WITH_SENTENCE)).toBe(true);
    expect(canRequestMoreTypingHints(0, WITHOUT_SENTENCE)).toBe(true);
    expect(canRequestMoreTypingHints(2, WITH_SENTENCE)).toBe(false);
  });
});

describe("getTypingHintButtonLabel", () => {
  it("다음에 열릴 것을 말한다", () => {
    expect(getTypingHintButtonLabel(0, WITH_SENTENCE)).toBe("예문 보기");
    expect(getTypingHintButtonLabel(1, WITH_SENTENCE)).toBe("첫 글자 보기");
  });

  it("예문이 없으면 0단계에서 바로 첫 글자를 말한다", () => {
    expect(getTypingHintButtonLabel(0, WITHOUT_SENTENCE)).toBe("첫 글자 보기");
  });
});
