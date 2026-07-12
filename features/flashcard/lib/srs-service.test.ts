// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// getNewVocabularies 는 Prisma 쿼리 함수이므로 @/lib/db 를 목킹해
// 실제 DB 없이 "쿼리 형태" 회귀만 고정한다 (RFC 콘텐츠 파이프라인 Phase 1.5 regression 가드).
// Phase 4 에서 flashcard `new` 모드에 adjacent fallback 을 넣기 전에,
// 현재 getNewVocabularies 의 두 보장을 먼저 잠근다.
vi.mock("@/lib/db", () => ({
  default: {
    userVocabulary: { findMany: vi.fn() },
    vocabulary: { findMany: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { getNewVocabularies } from "./srs-service";

const db = prisma as unknown as {
  userVocabulary: { findMany: ReturnType<typeof vi.fn> };
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  // 기본값: 조회 결과 없음. 각 테스트가 필요 시 override 한다.
  db.userVocabulary.findMany.mockResolvedValue([]);
  db.vocabulary.findMany.mockResolvedValue([]);
});

describe("getNewVocabularies (Phase 1.5 regression 가드)", () => {
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

  it("보장 2: exact level 만 조회한다 — where.level 은 전달 레벨과 정확히 일치(범위·in 아님)", async () => {
    await getNewVocabularies("user-1", "B2", 15);

    const arg = db.vocabulary.findMany.mock.calls[0][0];
    // exact 우선순위 고정: level 은 단일 문자열 동등 비교여야 한다.
    // Phase 4 에서 adjacent fallback 도입 시 이 단언을 의식적으로 갱신하며
    // exact-first 소진을 유지하도록 강제한다.
    expect(arg.where.level).toBe("B2");
    expect(arg.take).toBe(15);
    // oldest-first 결정성(일관된 진행)도 exact 소진 순서의 일부.
    expect(arg.orderBy).toEqual({ createdAt: "asc" });
  });

  it("조회 결과를 VocabularyWithProgress(userProgress: null)로 매핑한다", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple", level: "A1" }]);

    const result = await getNewVocabularies("user-1", "A1", 20);

    expect(result).toEqual([{ id: "v1", word: "apple", level: "A1", userProgress: null }]);
  });
});
