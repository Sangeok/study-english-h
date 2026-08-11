// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  calculateNextReview,
  addDays,
  DEFAULT_EASE_FACTOR,
  MIN_EASE_FACTOR,
  type SRSCard,
} from "./srs-algorithm";
import type { ReviewQuality } from "../types";

const newCard = (): SRSCard => ({
  repetitions: 0,
  easeFactor: DEFAULT_EASE_FACTOR,
  interval: 1,
  lastReviewDate: null,
  masteryLevel: "new",
});

/** 같은 버튼을 n회 연속으로 눌렀을 때의 interval 수열 */
function intervalSequence(quality: ReviewQuality, times: number): number[] {
  let card = newCard();
  const out: number[] = [];
  for (let i = 0; i < times; i++) {
    const r = calculateNextReview(card, quality, quality !== "forgot");
    out.push(r.interval);
    card = {
      ...card,
      repetitions: r.repetitions,
      easeFactor: r.easeFactor,
      interval: r.interval,
      masteryLevel: r.masteryLevel,
    };
  }
  return out;
}

describe("calculateNextReview — 간격 수열", () => {
  it("초기 3회는 버튼과 무관하게 1·3·7일로 고정된다", () => {
    expect(intervalSequence("easy", 3)).toEqual([1, 3, 7]);
    expect(intervalSequence("normal", 3)).toEqual([1, 3, 7]);
    expect(intervalSequence("hard", 3)).toEqual([1, 3, 7]);
  });

  it("4회차부터 easeFactor 차이가 간격을 벌린다", () => {
    expect(intervalSequence("easy", 6)).toEqual([1, 3, 7, 22, 71, 241]);
    expect(intervalSequence("normal", 6)).toEqual([1, 3, 7, 18, 45, 113]);
    expect(intervalSequence("hard", 6)).toEqual([1, 3, 7, 13, 23, 37]);
  });

  it("잊음은 매번 1일로 되돌린다", () => {
    expect(intervalSequence("forgot", 5)).toEqual([1, 1, 1, 1, 1]);
  });
});

describe("calculateNextReview — easeFactor", () => {
  it("정답 품질별 조정폭: easy +0.15 · normal 0 · hard -0.15", () => {
    const card = newCard();
    expect(calculateNextReview(card, "easy", true).easeFactor).toBeCloseTo(2.65, 10);
    expect(calculateNextReview(card, "normal", true).easeFactor).toBeCloseTo(2.5, 10);
    expect(calculateNextReview(card, "hard", true).easeFactor).toBeCloseTo(2.35, 10);
  });

  it("오답은 0.2 를 깎는다", () => {
    expect(calculateNextReview(newCard(), "forgot", false).easeFactor).toBeCloseTo(2.3, 10);
  });

  it("하한 1.3 아래로 내려가지 않는다", () => {
    const low: SRSCard = { ...newCard(), easeFactor: MIN_EASE_FACTOR };
    expect(calculateNextReview(low, "hard", true).easeFactor).toBe(MIN_EASE_FACTOR);
    expect(calculateNextReview(low, "forgot", false).easeFactor).toBe(MIN_EASE_FACTOR);
  });
});

describe("calculateNextReview — 오답 처리", () => {
  it("repetitions 를 0 으로 리셋하고 masteryLevel 을 new 로 강등한다", () => {
    const grown: SRSCard = {
      ...newCard(),
      repetitions: 9,
      interval: 200,
      masteryLevel: "mastered",
    };
    const r = calculateNextReview(grown, "forgot", false);

    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
    expect(r.masteryLevel).toBe("new");
  });
});

describe("calculateNextReview — masteryLevel 전이", () => {
  const at = (repetitions: number, interval: number) =>
    calculateNextReview(
      { ...newCard(), repetitions: repetitions - 1, interval, easeFactor: 1 },
      "normal",
      true
    ).masteryLevel;

  it("repetitions 1~2 는 learning", () => {
    expect(at(1, 1)).toBe("learning");
    expect(at(2, 3)).toBe("learning");
  });

  it("repetitions 3~7 은 reviewing", () => {
    expect(at(3, 7)).toBe("reviewing");
    expect(at(7, 100)).toBe("reviewing");
  });

  it("repetitions 8 이상이어도 interval 이 180 미만이면 reviewing 에 머문다", () => {
    expect(at(8, 100)).toBe("reviewing");
  });

  it("repetitions 8 이상 + interval 180 이상이면 mastered", () => {
    expect(
      calculateNextReview(
        { ...newCard(), repetitions: 7, interval: 180, easeFactor: 2.5 },
        "normal",
        true
      ).masteryLevel
    ).toBe("mastered");
  });
});

describe("calculateNextReview — now 주입", () => {
  it("주입한 시각을 기준으로 nextReviewDate 를 계산한다", () => {
    const now = new Date("2026-08-11T21:00:00+09:00");

    const r = calculateNextReview(newCard(), "normal", true, now);

    expect(r.nextReviewDate.toISOString()).toBe(
      new Date("2026-08-12T21:00:00+09:00").toISOString()
    );
  });

  it("오답 경로에서도 주입한 시각을 기준으로 삼는다", () => {
    const now = new Date("2026-08-11T21:00:00+09:00");

    const r = calculateNextReview(newCard(), "forgot", false, now);

    expect(r.nextReviewDate.toISOString()).toBe(
      new Date("2026-08-12T21:00:00+09:00").toISOString()
    );
  });
});

describe("addDays", () => {
  it("일수를 더하고 시·분·초는 보존한다", () => {
    const base = new Date("2026-08-11T21:00:00+09:00");
    const result = addDays(base, 1);

    expect(result.getTime() - base.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("원본 Date 를 변경하지 않는다", () => {
    const base = new Date("2026-08-11T21:00:00+09:00");
    const snapshot = base.getTime();
    addDays(base, 5);

    expect(base.getTime()).toBe(snapshot);
  });
});
