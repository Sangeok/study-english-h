// @vitest-environment node
/**
 * 오류 `reason` 전달 회귀 — 같은 status 안에서 화면이 갈리는 계약(403 세 갈래·409 세 갈래)이
 * `ApiError.body` 보존에 의존한다. body 를 버리면 여기가 먼저 깨진다.
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/lib";
import { readErrorAvailableAt, readErrorReason } from "./promotion-api";

describe("readErrorReason", () => {
  it("body 의 reason 문자열을 꺼낸다", () => {
    expect(readErrorReason(new ApiError(409, "…", { reason: "session-invalid" }))).toBe(
      "session-invalid"
    );
    expect(readErrorReason(new ApiError(403, "…", { reason: "cooldown" }))).toBe("cooldown");
  });

  it("body 가 없거나 reason 이 문자열이 아니면 null 이다 (일반 오류로 안전하게 떨어진다)", () => {
    expect(readErrorReason(new ApiError(500, "…"))).toBeNull();
    expect(readErrorReason(new ApiError(409, "…", null))).toBeNull();
    expect(readErrorReason(new ApiError(409, "…", "문자열 body"))).toBeNull();
    expect(readErrorReason(new ApiError(409, "…", { reason: 42 }))).toBeNull();
  });

  it("ApiError 가 아닌 예외도 null 이다 (instanceof 를 먼저 본다)", () => {
    expect(readErrorReason(new Error("boom"))).toBeNull();
    expect(readErrorReason("boom")).toBeNull();
    expect(readErrorReason(null)).toBeNull();
  });
});

describe("readErrorAvailableAt", () => {
  it("cooldown 안내의 D-n 계산용 ISO 를 꺼낸다", () => {
    const iso = "2026-07-27T00:00:00.000Z";
    expect(readErrorAvailableAt(new ApiError(403, "…", { availableAt: iso }))).toBe(iso);
  });

  it("없거나 문자열이 아니면 null 이다", () => {
    expect(readErrorAvailableAt(new ApiError(403, "…", { reason: "cooldown" }))).toBeNull();
    expect(readErrorAvailableAt(new ApiError(403, "…"))).toBeNull();
  });
});
