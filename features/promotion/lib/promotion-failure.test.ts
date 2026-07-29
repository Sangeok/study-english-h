// @vitest-environment node
/**
 * 서버 오류 → 화면 상태 매핑 회귀.
 *
 * 같은 status 안에서 화면이 갈린다(403 세 갈래·409 세 갈래).
 * 특히 409 level-changed 는 "다시 시작" 버튼이 뜨는 유일한 복구 경로이고,
 * 이것이 400 으로 뭉개지면 사용자가 재시도 루프에 갇힌다(§4-5 매핑표).
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/lib";
import { PROMOTION } from "@/shared/constants";
import {
  daysUntil,
  isRestartableFailure,
  promotionFailureCopy,
  toPromotionFailure,
} from "./promotion-failure";

const AVAILABLE_AT = "2026-07-27T00:00:00.000Z";

describe("toPromotionFailure — start 403 세 갈래", () => {
  it("cooldown 은 availableAt 까지 실어 나른다 (D-n 계산에 필요)", () => {
    const failure = toPromotionFailure(
      new ApiError(403, "…", { reason: "cooldown", availableAt: AVAILABLE_AT })
    );

    expect(failure).toEqual({ kind: "cooldown", availableAt: AVAILABLE_AT });
  });

  it("max-level 은 최고 레벨 안내로 간다", () => {
    expect(toPromotionFailure(new ApiError(403, "…", { reason: "max-level" }))).toEqual({
      kind: "max-level",
    });
  });

  it("locked 는 준비도 미달 안내로 간다", () => {
    expect(toPromotionFailure(new ApiError(403, "…", { reason: "locked" }))).toEqual({
      kind: "locked",
    });
  });

  it("reason 을 모르는 403 도 locked 로 안전하게 떨어진다 (빈 화면 금지)", () => {
    expect(toPromotionFailure(new ApiError(403, "…"))).toEqual({ kind: "locked" });
    expect(toPromotionFailure(new ApiError(403, "…", { reason: "무슨값" }))).toEqual({
      kind: "locked",
    });
  });
});

describe("toPromotionFailure — submit 409 세 갈래", () => {
  it("session-invalid 는 재시작 가능한 실패다", () => {
    const failure = toPromotionFailure(
      new ApiError(409, "…", { reason: "session-invalid" })
    );

    expect(failure).toEqual({ kind: "session-invalid" });
    expect(isRestartableFailure(failure)).toBe(true);
  });

  it("level-changed 는 재시작 가능한 실패다 — 재시도 루프 방지의 핵심", () => {
    const failure = toPromotionFailure(new ApiError(409, "…", { reason: "level-changed" }));

    expect(failure).toEqual({ kind: "level-changed" });
    expect(isRestartableFailure(failure)).toBe(true);
  });

  it("409 cooldown 은 재시작이 아니라 대기 안내다 (응시권을 쓰지 않았다)", () => {
    const failure = toPromotionFailure(
      new ApiError(409, "…", { reason: "cooldown", availableAt: AVAILABLE_AT })
    );

    expect(failure).toEqual({ kind: "cooldown", availableAt: AVAILABLE_AT });
    expect(isRestartableFailure(failure)).toBe(false);
  });

  it("reason 없는 409 는 unknown 이다 — 근거 없이 '다시 시작'을 권하지 않는다", () => {
    const failure = toPromotionFailure(new ApiError(409, "…"));

    expect(failure).toEqual({ kind: "unknown" });
    expect(isRestartableFailure(failure)).toBe(false);
  });
});

describe("toPromotionFailure — 그 밖의 응답", () => {
  it("503 은 콘텐츠 부족 안내다 (사용자 잘못이 아니다)", () => {
    expect(toPromotionFailure(new ApiError(503, "…"))).toEqual({
      kind: "content-unavailable",
    });
  });

  it("400·401·500 과 비-ApiError 는 일반 오류로 간다", () => {
    for (const error of [
      new ApiError(400, "…"),
      new ApiError(401, "…"),
      new ApiError(500, "…"),
      new Error("boom"),
      null,
    ]) {
      expect(toPromotionFailure(error)).toEqual({ kind: "unknown" });
    }
  });

  it("body 가 있어도 status 가 맞지 않으면 reason 을 신뢰하지 않는다", () => {
    // 400 에 level-changed 가 실려 와도 재시작 버튼을 띄우지 않는다 —
    // 계약상 그 조합은 존재하지 않고, 잘못 믿으면 무한 재시작이 된다.
    const failure = toPromotionFailure(
      new ApiError(400, "…", { reason: "level-changed" })
    );

    expect(failure).toEqual({ kind: "unknown" });
    expect(isRestartableFailure(failure)).toBe(false);
  });
});

describe("daysUntil", () => {
  const NOW = new Date("2026-07-24T00:00:00.000Z");

  it("남은 시간을 올림한다 — D-1 이 '오늘 중'을 뜻하지 않도록", () => {
    // 25시간 남았으면 이틀째다. 내림하면 D-1 이 되어 오늘 되는 것처럼 읽힌다.
    expect(daysUntil("2026-07-25T01:00:00.000Z", NOW)).toBe(2);
    expect(daysUntil("2026-07-24T01:00:00.000Z", NOW)).toBe(1);
  });

  it("이미 지난 시각도 최소 1 로 바닥을 둔다 (D-0·음수 표기 금지)", () => {
    expect(daysUntil("2026-07-20T00:00:00.000Z", NOW)).toBe(1);
  });
});

describe("promotionFailureCopy — 실패 7종이 각각 다른 안내로 끝난다", () => {
  const NOW = new Date("2026-07-24T00:00:00.000Z");

  it("locked 는 준비도 미달을 말한다", () => {
    expect(promotionFailureCopy({ kind: "locked" }, NOW)).toContain("준비도");
  });

  it("cooldown 은 availableAt 이 있으면 D-n 을 계산해 넣는다", () => {
    const copy = promotionFailureCopy(
      { kind: "cooldown", availableAt: "2026-07-27T00:00:00.000Z" },
      NOW
    );

    expect(copy).toContain("D-3");
  });

  it("cooldown 인데 availableAt 이 없으면 상수 기반 문구로 떨어진다 (D-undefined 금지)", () => {
    const copy = promotionFailureCopy({ kind: "cooldown", availableAt: null }, NOW);

    expect(copy).toContain(`${PROMOTION.RETRY_COOLDOWN_DAYS}일`);
    expect(copy).not.toContain("D-");
    expect(copy).not.toContain("NaN");
  });

  it("max-level·content-unavailable 은 사용자 잘못이 아님을 말한다", () => {
    expect(promotionFailureCopy({ kind: "max-level" }, NOW)).toContain("최고 레벨");
    expect(promotionFailureCopy({ kind: "content-unavailable" }, NOW)).toContain(
      "준비할 수 없어요"
    );
  });

  it("재시작 가능한 두 실패는 '다시 시작'을 안내한다", () => {
    expect(promotionFailureCopy({ kind: "session-invalid" }, NOW)).toContain("다시 시작");
    expect(promotionFailureCopy({ kind: "level-changed" }, NOW)).toContain("다시 시작");
  });

  it("어떤 실패도 빈 문자열로 끝나지 않는다 (조용히 삼켜지는 화면 금지)", () => {
    const all = [
      { kind: "locked" },
      { kind: "cooldown", availableAt: null },
      { kind: "max-level" },
      { kind: "content-unavailable" },
      { kind: "session-invalid" },
      { kind: "level-changed" },
      { kind: "unknown" },
    ] as const;

    for (const failure of all) {
      expect(promotionFailureCopy(failure, NOW).length).toBeGreaterThan(0);
    }
  });

  it("재시작 불가한 실패의 카피는 '다시 시작'을 권하지 않는다", () => {
    // 쿨다운·최고 레벨에서 다시 시작 버튼이 없는데 카피만 그렇게 말하면 막다른 안내가 된다.
    for (const failure of [
      { kind: "cooldown", availableAt: null },
      { kind: "max-level" },
      { kind: "locked" },
    ] as const) {
      expect(isRestartableFailure(failure)).toBe(false);
      expect(promotionFailureCopy(failure, NOW)).not.toContain("다시 시작");
    }
  });
});
