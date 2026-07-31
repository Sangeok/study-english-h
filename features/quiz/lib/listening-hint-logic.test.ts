// @vitest-environment node
/**
 * 리스닝 힌트 사다리 — 읽기 사다리와 섞이지 않는지의 회귀.
 *
 * 지키는 것: 리스닝이 데이터(contextHint) 유무와 무관하게 항상 2단계까지 열린다는 것.
 * 읽기 사다리(quiz-hint-logic)는 contextHint 가 없으면 1단계로 접히는데, 리스닝 문항에는
 * 그 필드가 아예 없다. 그쪽 술어를 하나라도 재사용하면 철자 힌트에 영원히 도달하지 못한다.
 */
import { describe, expect, it } from "vitest";
import {
  canRequestMoreListeningHints,
  getListeningHintButtonLabel,
  getListeningMaxHintLevel,
  shouldPlaySlowly,
  shouldShowSpelling,
} from "./listening-hint-logic";

const LEVELS = [0, 1, 2] as const;

describe("getListeningMaxHintLevel", () => {
  it("항상 2를 돌려준다 — 무인자라 contextHint 를 먹일 수 없다", () => {
    expect(getListeningMaxHintLevel()).toBe(2);
    // 시그니처가 무인자라는 것 자체가 계약이다. 인자를 받게 바뀌면 읽기 사다리와
    // 혼동돼 접히는 경로가 되살아난다.
    expect(getListeningMaxHintLevel.length).toBe(0);
  });
});

describe("단계별 노출", () => {
  it("1단계는 배속만 — 철자는 열리지 않는다", () => {
    expect(shouldPlaySlowly(1)).toBe(true);
    expect(shouldShowSpelling(1)).toBe(false);
  });

  it("2단계에서만 철자가 열린다", () => {
    expect(shouldShowSpelling(2)).toBe(true);
  });

  it("0단계는 아무것도 열지 않는다", () => {
    expect(shouldPlaySlowly(0)).toBe(false);
    expect(shouldShowSpelling(0)).toBe(false);
  });
});

describe("canRequestMoreListeningHints", () => {
  it("1단계에서 true 다 — 여기서 false 면 버튼이 사라져 2단계에 도달할 수 없다", () => {
    // 이 단언이 이 파일의 핵심이다. 훅이 2단계를 허용해도 버튼 술어가 막으면
    // 사용자는 철자 힌트를 요청할 방법이 없다(읽기의 canRequestMoreHints 가 그 경로다).
    expect(canRequestMoreListeningHints(1)).toBe(true);
  });

  it("0단계에서 true, 2단계에서 false", () => {
    expect(canRequestMoreListeningHints(0)).toBe(true);
    expect(canRequestMoreListeningHints(2)).toBe(false);
  });
});

describe("getListeningHintButtonLabel", () => {
  it("읽기의 '전체 힌트 보기'(뜻 공개)가 아니라 소리·철자 문구를 쓴다", () => {
    expect(getListeningHintButtonLabel(0)).toBe("느리게 듣기");
    expect(getListeningHintButtonLabel(1)).toBe("철자 보기");
  });

  it("어떤 단계에서도 빈 문자열이 아니다", () => {
    for (const level of LEVELS) {
      expect(getListeningHintButtonLabel(level).length).toBeGreaterThan(0);
    }
  });
});
