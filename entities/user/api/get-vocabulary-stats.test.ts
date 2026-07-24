// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    userVocabulary: { groupBy: vi.fn(), count: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { getVocabularyStats } from "./get-vocabulary-stats";

const db = prisma as unknown as {
  userVocabulary: { groupBy: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
};

const USER_ID = "user-1";
const NOW = new Date("2026-07-24T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  db.userVocabulary.groupBy.mockResolvedValue([
    { masteryLevel: "mastered", _count: 2 },
    { masteryLevel: "learning", _count: 3 },
  ]);
  db.userVocabulary.count.mockResolvedValue(4);
});

describe("getVocabularyStats (어휘 통계 집계)", () => {
  it("mastery 버킷을 합산하고 mastered 만 따로 센다", async () => {
    const result = await getVocabularyStats(USER_ID, NOW);

    // 2 + 3 — 버킷 합. mastered 2 는 무연산 통과
    expect(result).toEqual({ totalWordLearned: 5, masteredWords: 2, reviewNeeded: 4 });
  });

  it("도래 기준 시각으로 주입된 now 를 사용한다 (시간 의존 값의 경계 고정)", async () => {
    await getVocabularyStats(USER_ID, NOW);

    expect(db.userVocabulary.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, nextReviewDate: { lte: NOW } },
    });
  });

  it("어휘가 없으면 세 값 모두 0 이다", async () => {
    db.userVocabulary.groupBy.mockResolvedValue([]);
    db.userVocabulary.count.mockResolvedValue(0);

    const result = await getVocabularyStats(USER_ID, NOW);

    expect(result).toEqual({ totalWordLearned: 0, masteredWords: 0, reviewNeeded: 0 });
  });
});
