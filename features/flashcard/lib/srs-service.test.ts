// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// getNewVocabularies 는 Prisma 쿼리 함수이므로 @/lib/db 를 목킹해
// 실제 DB 없이 "쿼리 형태·우선순위"를 고정한다.
// (Phase 1.5 에서 exact-only 를 잠갔고, Phase 4 에서 adjacent fallback 도입에 맞춰 의식적으로 갱신했다.)
vi.mock("@/lib/db", () => ({
  default: {
    userVocabulary: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    vocabulary: { findMany: vi.fn() },
    userProfile: { update: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { getReviewDueFilter } from "@/entities/user";
import { buildAdjacentPriority } from "@/shared/constants";
import {
  getDueVocabularies,
  getNewVocabularies,
  recordReview,
  updateProfileStats,
} from "./srs-service";

const db = prisma as unknown as {
  userVocabulary: {
    findMany: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
  userProfile: { update: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  // 기본값: 조회 결과 없음. 각 테스트가 필요 시 override 한다.
  db.userVocabulary.findMany.mockResolvedValue([]);
  db.vocabulary.findMany.mockResolvedValue([]);
  db.userVocabulary.findUnique.mockResolvedValue(null);
  db.userVocabulary.upsert.mockResolvedValue({});
});

describe("getDueVocabularies (도래 조회)", () => {
  // 시간 의존 헬퍼의 기존 관례(streak·get-vocabulary-stats·calculateNextReview)를 따라
  // now 를 주입받는다. 주입이 없으면 날짜 경계 동작을 고정할 방법이 없다.
  // 실행 시점의 오늘과 반드시 다른 날짜여야 한다 — 컷오프는 하루 동안 움직이지 않으므로
  // 오늘 날짜를 쓰면 주입이 무시돼도 값이 같아져 테스트가 우연히 통과한다.
  const NOW = new Date("2026-06-15T08:00:00+09:00");

  it("주입한 시각으로 도래 필터를 만든다", async () => {
    await getDueVocabularies("user-1", 20, NOW);

    expect(db.userVocabulary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", nextReviewDate: getReviewDueFilter(NOW) },
      })
    );
  });

  it("어제 저녁에 학습한 카드를 오늘 아침 조회에 포함한다", async () => {
    // 6/14 21:00 학습 + interval 1일 → 저장된 도래일은 6/15 21:00.
    // 시점 비교(lte: now)였다면 6/15 08:00 조회에서 빠진다.
    const sameDayEvening = new Date("2026-06-15T21:00:00+09:00");
    // 하루 뒤 도래분은 아직 열리지 않아야 한다 — 이 단언이 컷오프를 NOW 에 묶는다.
    const nextDayEvening = new Date("2026-06-16T21:00:00+09:00");

    await getDueVocabularies("user-1", 20, NOW);

    const { where } = db.userVocabulary.findMany.mock.calls[0][0];
    expect(sameDayEvening < where.nextReviewDate.lt).toBe(true);
    expect(nextDayEvening < where.nextReviewDate.lt).toBe(false);
  });
});

describe("getNewVocabularies (adjacent fallback, Phase 4)", () => {
  it("보장 1: 이미 학습한 어휘를 제외한다 — where.id.notIn = 학습한 vocabularyId 목록", async () => {
    db.userVocabulary.findMany.mockResolvedValue([
      { vocabularyId: "v1" },
      { vocabularyId: "v2" },
    ]);

    await getNewVocabularies("user-1", "A1", 20);

    // 학습 이력은 userId 로만 조회하고 vocabularyId 만 select 한다.
    expect(db.userVocabulary.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { vocabularyId: true },
    });
    // 그 목록이 vocabulary 조회의 notIn 으로 그대로 전달된다.
    const arg = db.vocabulary.findMany.mock.calls[0][0];
    expect(arg.where.id).toEqual({ notIn: ["v1", "v2"] });
  });

  it("학습 이력이 없으면 notIn 은 빈 배열이다(제외 로직은 유지)", async () => {
    await getNewVocabularies("user-1", "A1", 20);

    const arg = db.vocabulary.findMany.mock.calls[0][0];
    expect(arg.where.id).toEqual({ notIn: [] });
  });

  it("보장 2(갱신): exact-first 우선순위로 단일 조회 — where.level.in 의 첫 원소가 exact, take 없음", async () => {
    await getNewVocabularies("user-1", "B2", 15);

    const arg = db.vocabulary.findMany.mock.calls[0][0];
    // tier 별 반복 쿼리 금지 → level in 목록으로 한 번에 조회, exact(B2)가 최우선.
    expect(arg.where.level).toEqual({ in: buildAdjacentPriority("B2") });
    expect(arg.where.level.in[0]).toBe("B2");
    // limit 은 in-memory slice 로 적용되므로 쿼리에는 take 가 없다.
    expect(arg.take).toBeUndefined();
    // oldest-first 결정성(레벨 내 일관된 진행)은 유지.
    expect(arg.orderBy).toEqual({ createdAt: "asc" });
  });

  it("보장 2b: exact 가 limit 을 채우면 exact 만 반환한다(exact-first 소진)", async () => {
    // 후보에 exact(A1) 3개 + 인접(A2) 1개. limit 2 → A1 우선 2개만, 입력(createdAt) 순 보존.
    db.vocabulary.findMany.mockResolvedValue([
      { id: "a1-1", level: "A1" },
      { id: "a2-1", level: "A2" },
      { id: "a1-2", level: "A1" },
      { id: "a1-3", level: "A1" },
    ]);

    const result = await getNewVocabularies("user-1", "A1", 2);

    expect(result.map((r) => r.id)).toEqual(["a1-1", "a1-2"]);
  });

  it("보장 2c: exact 부족분은 인접 하위 → 인접 상위 순으로 채운다", async () => {
    // B1 기준. 후보를 일부러 우선순위와 다른 순서로 준다.
    db.vocabulary.findMany.mockResolvedValue([
      { id: "b2", level: "B2" }, // 인접 상위
      { id: "b1", level: "B1" }, // exact
      { id: "a2", level: "A2" }, // 인접 하위
    ]);

    const result = await getNewVocabularies("user-1", "B1", 3);

    // exact(B1) → 인접 하위(A2) → 인접 상위(B2)
    expect(result.map((r) => r.id)).toEqual(["b1", "a2", "b2"]);
  });

  it("보장 3: 유효하지 않은 level 은 보수적 기본값(A1)으로 정규화한다", async () => {
    await getNewVocabularies("user-1", "ZZ", 20);

    const arg = db.vocabulary.findMany.mock.calls[0][0];
    expect(arg.where.level.in[0]).toBe("A1");
    expect(arg.where.level).toEqual({ in: buildAdjacentPriority("A1") });
  });

  it("조회 결과를 VocabularyWithProgress(userProgress: null)로 매핑한다", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple", level: "A1" }]);

    const result = await getNewVocabularies("user-1", "A1", 20);

    expect(result).toEqual([{ id: "v1", word: "apple", level: "A1", userProgress: null }]);
  });
});

describe("updateProfileStats (컬럼 위임)", () => {
  const USER_ID = "user-1";

  it("집계 결과를 그대로 UserProfile 컬럼에 기록한다", async () => {
    db.userVocabulary.groupBy.mockResolvedValue([
      { masteryLevel: "mastered", _count: 2 },
      { masteryLevel: "learning", _count: 3 },
    ]);
    db.userVocabulary.count.mockResolvedValue(4);

    await updateProfileStats(USER_ID);

    // getVocabularyStats(entities)를 모킹하지 않고 같은 @/lib/db 목 위에서 실제 실행시켜
    // 위임 결과가 그대로 컬럼 payload 로 전달되는지 확인한다.
    expect(db.userProfile.update).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      data: { totalWordLearned: 5, masteredWords: 2, reviewNeeded: 4 },
    });
  });
});

describe("recordReview (첫 편입 시드)", () => {
  const USER_ID = "user-1";

  // 퀴즈 편입은 확신도에 따라 첫 복습 간격을 나눈다(ADR 0002).
  // SM-2 의 repetitions 1·2·3 이 곧 1일·3일·7일이라, 시드로 그 간격을 얻는다.
  it("기존 진행도가 없으면 initialRepetitions 를 시작점으로 삼는다 (무힌트 정답 → 7일)", async () => {
    await recordReview(USER_ID, "v1", "normal", true, 2);

    const payload = db.userVocabulary.upsert.mock.calls[0][0];
    expect(payload.create.repetitions).toBe(3);
    expect(payload.create.interval).toBe(7);
    expect(payload.create.masteryLevel).toBe("reviewing");
  });

  it("힌트를 쓴 정답 시드는 3일로 이어진다", async () => {
    await recordReview(USER_ID, "v1", "hard", true, 1);

    const payload = db.userVocabulary.upsert.mock.calls[0][0];
    expect(payload.create.repetitions).toBe(2);
    expect(payload.create.interval).toBe(3);
  });

  it("이미 편입된 단어면 시드를 무시하고 기존 진행도에서 이어간다", async () => {
    db.userVocabulary.findUnique.mockResolvedValue({
      repetitions: 5,
      easeFactor: 2.5,
      interval: 40,
      lastReviewDate: new Date("2026-07-01T00:00:00.000Z"),
      masteryLevel: "reviewing",
    });

    await recordReview(USER_ID, "v1", "normal", true, 2);

    const payload = db.userVocabulary.upsert.mock.calls[0][0];
    // 시드(2)가 아니라 기존 5 에서 +1, 간격도 40 × easeFactor 로 이어진다
    expect(payload.update.repetitions).toBe(6);
    expect(payload.update.interval).toBe(100);
  });

  it("오답은 시드와 무관하게 1일로 리셋된다", async () => {
    db.userVocabulary.findUnique.mockResolvedValue({
      repetitions: 5,
      easeFactor: 2.5,
      interval: 40,
      lastReviewDate: new Date("2026-07-01T00:00:00.000Z"),
      masteryLevel: "reviewing",
    });

    await recordReview(USER_ID, "v1", "forgot", false, 0);

    const payload = db.userVocabulary.upsert.mock.calls[0][0];
    expect(payload.update.repetitions).toBe(0);
    expect(payload.update.interval).toBe(1);
    expect(payload.update.easeFactor).toBeCloseTo(2.3);
  });
});
