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
import { isRestartableFailure, toPromotionFailure } from "./promotion-failure";

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
