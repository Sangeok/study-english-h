// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// getNewVocabularies 는 Prisma 쿼리 함수이므로 @/lib/db 를 목킹해
// 실제 DB 없이 "쿼리 형태·우선순위"를 고정한다.
// (Phase 1.5 에서 exact-only 를 잠갔고, Phase 4 에서 adjacent fallback 도입에 맞춰 의식적으로 갱신했다.)
vi.mock("@/lib/db", () => ({
  default: {
    userVocabulary: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    vocabulary: { findMany: vi.fn() },
    userProfile: { update: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { buildAdjacentPriority } from "@/shared/constants";
import { getNewVocabularies, updateProfileStats } from "./srs-service";

const db = prisma as unknown as {
  userVocabulary: {
    findMany: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
  userProfile: { update: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  // 기본값: 조회 결과 없음. 각 테스트가 필요 시 override 한다.
  db.userVocabulary.findMany.mockResolvedValue([]);
  db.vocabulary.findMany.mockResolvedValue([]);
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
