// @vitest-environment node
/**
 * 타이핑 채점 — 엄격 채점의 경계를 고정한다.
 *
 * 흡수하는 것은 키보드가 강제하는 것(자동 대문자·앞뒤 공백)뿐이고, 철자는 그대로 본다.
 * 편집거리 허용을 두지 않는 이유가 4번 케이스에 있다 — 짧은 단어에서 거리 1 은
 * 오타가 아니라 다른 단어다.
 */
import { describe, expect, it } from "vitest";
import { isTypedAnswerCorrect, normalizeTypedAnswer } from "./typing-grading";

describe("정답으로 흡수하는 것 — 키보드가 강제하는 것뿐", () => {
  it("대소문자를 흡수한다 — 모바일 자동 대문자는 사용자 실수가 아니다", () => {
    expect(isTypedAnswerCorrect("Borrow", "borrow")).toBe(true);
    expect(isTypedAnswerCorrect("BORROW", "borrow")).toBe(true);
    expect(isTypedAnswerCorrect("bOrRoW", "borrow")).toBe(true);
  });

  it("앞뒤 공백을 흡수한다", () => {
    expect(isTypedAnswerCorrect("  borrow  ", "borrow")).toBe(true);
    expect(isTypedAnswerCorrect("borrow\n", "borrow")).toBe(true);
  });

  it("정답 쪽도 정규화한다 — DB 값에 공백이 섞여도 사용자가 틀리지 않는다", () => {
    expect(isTypedAnswerCorrect("borrow", " Borrow ")).toBe(true);
  });
});

describe("오답으로 두는 것", () => {
  it("한 글자 오타는 오답이다", () => {
    expect(isTypedAnswerCorrect("borow", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("borrw", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("borrowe", "borrow")).toBe(false);
  });

  it("어형변화는 오답이다 — 사전형 철자를 묻는 과제다", () => {
    expect(isTypedAnswerCorrect("borrowed", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("borrowing", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("borrows", "borrow")).toBe(false);
  });

  it("유의어는 오답이다 — 발음이 변별 수단이다", () => {
    expect(isTypedAnswerCorrect("lend", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("target", "goal")).toBe(false);
  });

  it("편집거리 1 인 다른 단어가 통과하지 않는다 — 허용 규칙을 두지 않은 이유", () => {
    // 이 셋은 전부 거리 1 이다. 오타 허용을 넣으면 다른 단어가 정답 처리된다.
    expect(isTypedAnswerCorrect("land", "lend")).toBe(false);
    expect(isTypedAnswerCorrect("from", "form")).toBe(false);
    expect(isTypedAnswerCorrect("cat", "cut")).toBe(false);
  });

  it("빈 입력·공백만은 오답이다", () => {
    expect(isTypedAnswerCorrect("", "borrow")).toBe(false);
    expect(isTypedAnswerCorrect("   ", "borrow")).toBe(false);
  });

  it("정답 단어가 빈 문자열이어도 빈 입력이 통과하지 않는다", () => {
    expect(isTypedAnswerCorrect("", "")).toBe(false);
  });
});

describe("normalizeTypedAnswer", () => {
  it("소문자화 + trim 만 한다 — 내부 공백이나 철자는 건드리지 않는다", () => {
    expect(normalizeTypedAnswer("  BoRRow ")).toBe("borrow");
    expect(normalizeTypedAnswer("two words")).toBe("two words");
  });
});
