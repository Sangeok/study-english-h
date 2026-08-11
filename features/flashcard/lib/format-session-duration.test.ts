import { describe, expect, it } from "vitest";

import { formatSessionDuration } from "./format-session-duration";

describe("formatSessionDuration", () => {
  it("1분 미만은 초만 보여준다", () => {
    expect(formatSessionDuration(42)).toBe("42초");
  });

  it("정확히 나누어떨어지면 초를 생략한다", () => {
    expect(formatSessionDuration(120)).toBe("2분");
  });

  it("분과 초를 함께 보여준다", () => {
    expect(formatSessionDuration(372)).toBe("6분 12초");
  });

  it("소수점 초는 내림한다", () => {
    expect(formatSessionDuration(59.9)).toBe("59초");
  });

  // URL fallback 경로에서 duration 파라미터가 없으면 0 또는 NaN 이 들어올 수 있다.
  it("0 이하이거나 유효하지 않은 값은 0초로 떨어진다", () => {
    expect(formatSessionDuration(0)).toBe("0초");
    expect(formatSessionDuration(-5)).toBe("0초");
    expect(formatSessionDuration(Number.NaN)).toBe("0초");
  });
});
