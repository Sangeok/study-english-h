import { describe, it, expect } from "vitest";
import {
  calculateLevelProgress,
  calculateRetryAvailability,
  derivePromotionStatus,
} from "./level-progress";
import { LEVEL_PROGRESS, PROMOTION } from "@/shared/constants";
import { ACCURACY_THRESHOLDS } from "@/features/diagnosis/config";

describe("calculateLevelProgress", () => {
  const EMPTY = {
    maturityScoreSum: 0,
    recentAttemptCount: 0,
    recentCorrectCount: 0,
    reviewDebt: 0,
    totalWords: 0,
  };

  /** A·B 를 만점으로 채워 D 만 관찰하는 기준선 */
  const SATURATED_AB = {
    maturityScoreSum: 999_999,
    recentAttemptCount: 999_999,
    recentCorrectCount: 999_999,
  };

  it("콜드 스타트(모든 입력 0)는 0이다", () => {
    // no-computation: 모든 성분이 0 항등 입력
    expect(calculateLevelProgress(EMPTY)).toBe(0);
  });

  it("상한 포화 입력은 100, 부채만 극단이면 0 — clamp 가드의 경계값", () => {
    // no-computation: min(…,1)·min(100,…)·max(0,…) 가드에서 도출되는 경계값
    expect(calculateLevelProgress({ ...SATURATED_AB, reviewDebt: 0, totalWords: 100 })).toBe(100);
    // 보유 0 에 부채만 있는 것은 모순 입력이다 — 비율을 만들 수 없으므로 페널티가 없다.
    expect(calculateLevelProgress({ ...EMPTY, reviewDebt: 999_999 })).toBe(0);
  });

  it("복습 부채 페널티는 도래 개수가 아니라 도래 비율에 비례한다", () => {
    // 절대 개수로 재면 보유 단어가 늘수록 자동으로 상한에 붙어, 밀린 사용자와 성실히
    // 복습하는 사용자를 구분하지 못한다(정상 상태의 하루 도래는 Σ(1/interval) 이라
    // 어휘가 수백 개만 돼도 상한을 넘는다). 그래서 비율로 잰다.
    const quarter = calculateLevelProgress({ ...SATURATED_AB, totalWords: 100, reviewDebt: 25 });
    const half = calculateLevelProgress({ ...SATURATED_AB, totalWords: 100, reviewDebt: 50 });
    const all = calculateLevelProgress({ ...SATURATED_AB, totalWords: 100, reviewDebt: 100 });

    // 비율 100% 에서 상한에 닿는다
    expect(100 - all).toBe(LEVEL_PROGRESS.MAX_REVIEW_DEBT_PENALTY);
    // 비율이 낮을수록 페널티가 작다 (반올림 위치에 무관한 단조성으로 검증)
    expect(quarter).toBeGreaterThan(half);
    expect(half).toBeGreaterThan(all);
  });

  it("같은 도래 개수라도 보유 단어가 많으면 페널티가 작다", () => {
    // 옛 계약(개수 기반)에서는 이 둘이 같은 값이었다.
    const small = calculateLevelProgress({ ...SATURATED_AB, totalWords: 40, reviewDebt: 20 });
    const large = calculateLevelProgress({ ...SATURATED_AB, totalWords: 400, reviewDebt: 20 });

    expect(large).toBeGreaterThan(small);
  });

  it("보유 단어가 DEBT_MIN_VOLUME 미만이면 전부 도래여도 감쇠된다", () => {
    // 3단어 중 3개 도래가 곧바로 최대 페널티가 되면 초기 사용자에게 과하다.
    const few = calculateLevelProgress({ ...SATURATED_AB, totalWords: 3, reviewDebt: 3 });
    const enough = calculateLevelProgress({
      ...SATURATED_AB,
      totalWords: LEVEL_PROGRESS.DEBT_MIN_VOLUME,
      reviewDebt: LEVEL_PROGRESS.DEBT_MIN_VOLUME,
    });

    expect(few).toBeGreaterThan(enough);
  });

  it("성숙도 증가는 진행률을 감소시키지 않는다 (단조성)", () => {
    // Tier B: A = min(x/TARGET,1) 이 x 에 단조 — 산식 계약에서 도출
    const lo = calculateLevelProgress({ ...EMPTY, maturityScoreSum: 10 });
    const hi = calculateLevelProgress({ ...EMPTY, maturityScoreSum: 20 });
    expect(hi).toBeGreaterThanOrEqual(lo);
  });

  it("시도 수가 ACCURACY_MIN_VOLUME 미만이면 전승이어도 감쇠된다", () => {
    // Tier B: volumeFactor = min(count/MIN_VOLUME,1) 계약 — 소량 전승 < 충분량 전승
    const few = calculateLevelProgress({
      ...EMPTY,
      recentAttemptCount: 3,
      recentCorrectCount: 3,
    });
    const enough = calculateLevelProgress({
      ...EMPTY,
      recentAttemptCount: LEVEL_PROGRESS.ACCURACY_MIN_VOLUME,
      recentCorrectCount: LEVEL_PROGRESS.ACCURACY_MIN_VOLUME,
    });
    expect(few).toBeLessThan(enough);
  });

  it("결과는 항상 정수이고 0~100 범위다", () => {
    // Tier B: Math.round + clamp 계약
    const v = calculateLevelProgress({
      maturityScoreSum: 37,
      recentAttemptCount: 21,
      recentCorrectCount: 13,
      reviewDebt: 4,
      totalWords: 37,
    });
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe("derivePromotionStatus", () => {
  const NOW = new Date("2026-07-24T00:00:00Z");

  it("C2 는 진행률과 무관하게 max-level 이다", () => {
    expect(derivePromotionStatus("C2", 100, null, NOW).status).toBe("max-level");
  });

  it("쿨다운이 진행률 100 보다 우선한다", () => {
    // 계약: 실패 직후엔 편입 단어 도래 전이라 100 이 유지될 수 있으므로 쿨다운 먼저
    const failedAt = new Date(NOW.getTime() - 1000);
    const r = derivePromotionStatus("B1", 100, failedAt, NOW);
    expect(r.status).toBe("cooldown");
    expect(r.availableAt?.getTime()).toBe(
      failedAt.getTime() + PROMOTION.RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    );
  });

  it("쿨다운 경과 + 100 이면 eligible, 미만이면 locked", () => {
    const oldFail = new Date(
      NOW.getTime() - (PROMOTION.RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 + 1)
    );
    expect(derivePromotionStatus("B1", 100, oldFail, NOW).status).toBe("eligible");
    expect(derivePromotionStatus("B1", 99, null, NOW).status).toBe("locked");
  });
});

describe("calculateRetryAvailability (쿨다운 단독 술어)", () => {
  const NOW = new Date("2026-07-24T00:00:00Z");

  it("실패 이력이 없으면 즉시 재응시 가능하다", () => {
    expect(calculateRetryAvailability(null, NOW)).toEqual({ canRetry: true, availableAt: null });
  });

  it("쿨다운 창 안이면 canRetry=false 이고 availableAt 은 실패 + RETRY_COOLDOWN_DAYS 다", () => {
    const failedAt = new Date(NOW.getTime() - 1000);
    const r = calculateRetryAvailability(failedAt, NOW);

    expect(r.canRetry).toBe(false);
    expect(r.availableAt?.getTime()).toBe(
      failedAt.getTime() + PROMOTION.RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    );
  });

  // 계약: submit 라우트는 이 술어만 쓰고 derivePromotionStatus 는 이를 위임한다(§4-2, §4-7).
  //   두 경로가 갈라지면 제출 쿨다운과 화면 표기가 어긋난다.
  it("derivePromotionStatus 의 cooldown 판정과 같은 값을 낸다 (단일 출처)", () => {
    const failedAt = new Date(NOW.getTime() - 1000);
    const derived = derivePromotionStatus("B1", 100, failedAt, NOW);
    const direct = calculateRetryAvailability(failedAt, NOW);

    expect(derived.status).toBe("cooldown");
    expect(derived.availableAt?.getTime()).toBe(direct.availableAt?.getTime());
  });
});

// 추가 테스트 1b — 80% 미러링 불변식.
//   테스트는 FSD 레이어 예외라 교차 import 가능. 주석 링크(F11)를 컴파일/실행 강제로 승격한다:
//   entities 는 features/diagnosis/config 를 import 할 수 없어 컴파일러가 이 미러링을 못 잡는다.
describe("80% 임계 미러링 (진단 GOOD ↔ 승급)", () => {
  it("ACCURACY_FULL_MARK 는 진단 GOOD 임계와 같다", () => {
    expect(LEVEL_PROGRESS.ACCURACY_FULL_MARK).toBe(ACCURACY_THRESHOLDS.GOOD);
  });

  it("승급 통과선(PASS_COUNT / QUESTION_COUNT)도 같은 80% 다", () => {
    expect((PROMOTION.PASS_COUNT / PROMOTION.QUESTION_COUNT) * 100).toBe(
      ACCURACY_THRESHOLDS.GOOD
    );
  });
});
