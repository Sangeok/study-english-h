// @vitest-environment node
import { describe, it, expect } from "vitest";
import { REVIEW_ROLLOVER_HOUR, getReviewDueFilter } from "./review-due";

const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("getReviewDueFilter — 컷오프 경계", () => {
  it("롤오버 시각 이후에 접속하면 컷오프는 다음날 롤오버다", () => {
    const filter = getReviewDueFilter(kst("2026-08-11T08:00:00"));

    expect(filter.lt.toISOString()).toBe(kst("2026-08-12T04:00:00").toISOString());
  });

  it("롤오버 시각 이전에 접속하면 컷오프는 당일 롤오버다", () => {
    const filter = getReviewDueFilter(kst("2026-08-11T02:00:00"));

    expect(filter.lt.toISOString()).toBe(kst("2026-08-11T04:00:00").toISOString());
  });

  it("롤오버 정각은 새 하루의 시작으로 친다", () => {
    const filter = getReviewDueFilter(kst("2026-08-11T04:00:00"));

    expect(filter.lt.toISOString()).toBe(kst("2026-08-12T04:00:00").toISOString());
  });

  it("롤오버 1초 전은 아직 전날이다", () => {
    const filter = getReviewDueFilter(kst("2026-08-11T03:59:59"));

    expect(filter.lt.toISOString()).toBe(kst("2026-08-11T04:00:00").toISOString());
  });

  it("컷오프는 하루 동안 움직이지 않는다", () => {
    const morning = getReviewDueFilter(kst("2026-08-11T08:00:00"));
    const evening = getReviewDueFilter(kst("2026-08-11T23:59:00"));

    expect(morning.lt.toISOString()).toBe(evening.lt.toISOString());
  });
});

describe("getReviewDueFilter — 회귀: 학습 시각에 갇히지 않는다", () => {
  it("어제 21:00 학습분을 오늘 아침에 도래로 잡는다", () => {
    // 8/10 21:00 학습 + interval 1일 → 저장된 도래일은 8/11 21:00
    const storedDueDate = kst("2026-08-11T21:00:00");
    const visitedAt = kst("2026-08-11T08:00:00");

    const filter = getReviewDueFilter(visitedAt);

    expect(storedDueDate < filter.lt).toBe(true);
  });

  it("내일 도래분은 오늘 잡지 않는다", () => {
    const storedDueDate = kst("2026-08-12T21:00:00");
    const visitedAt = kst("2026-08-11T08:00:00");

    const filter = getReviewDueFilter(visitedAt);

    expect(storedDueDate < filter.lt).toBe(false);
  });

  it("자정 직후에도 그날 도래분이 열려 있다", () => {
    const storedDueDate = kst("2026-08-11T21:00:00");
    const visitedAt = kst("2026-08-11T05:00:00");

    const filter = getReviewDueFilter(visitedAt);

    expect(storedDueDate < filter.lt).toBe(true);
  });
});

describe("REVIEW_ROLLOVER_HOUR", () => {
  it("자정이 아니다 — 늦은 밤 학습분이 몇 분 뒤 재도래하는 것을 막는다", () => {
    expect(REVIEW_ROLLOVER_HOUR).toBeGreaterThan(0);
    expect(REVIEW_ROLLOVER_HOUR).toBeLessThan(12);
  });
});
