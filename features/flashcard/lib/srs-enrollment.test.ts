// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    vocabulary: { findMany: vi.fn() },
  },
}));

vi.mock("./srs-service", () => ({
  recordReview: vi.fn(),
}));

import prisma from "@/lib/db";
import { recordReview } from "./srs-service";
import { enrollWordsToSrs } from "./srs-enrollment";

const db = prisma as unknown as {
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
};
const recordReviewMock = recordReview as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  db.vocabulary.findMany.mockResolvedValue([]);
  recordReviewMock.mockResolvedValue({});
});

describe("enrollWordsToSrs (오답 편입)", () => {
  it("정규화·중복 제거 후 insensitive 조회한다", async () => {
    await enrollWordsToSrs("user-1", [" Apple", "apple", "banana", ""]);

    expect(db.vocabulary.findMany).toHaveBeenCalledWith({
      where: { word: { in: ["apple", "banana"], mode: "insensitive" } },
      select: { id: true },
    });
  });

  it("매치된 단어마다 recordReview('forgot', false)를 호출하고 개수를 반환한다", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1" }, { id: "v2" }]);

    const result = await enrollWordsToSrs("user-1", ["apple", "banana", "unlinked"]);

    expect(recordReviewMock).toHaveBeenCalledTimes(2);
    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "forgot", false);
    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v2", "forgot", false);
    // 미연결 단어는 조회에서 탈락 — enrolledCount 는 매치 수와 같다
    expect(result).toEqual({ enrolledCount: 2 });
  });

  it("빈 입력이면 조회 없이 0을 반환한다", async () => {
    const result = await enrollWordsToSrs("user-1", []);

    expect(db.vocabulary.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ enrolledCount: 0 });
  });

  it("조회 실패 시 null을 반환한다 (best-effort 계약)", async () => {
    db.vocabulary.findMany.mockRejectedValue(new Error("db down"));

    const result = await enrollWordsToSrs("user-1", ["apple"]);

    expect(result).toBeNull();
  });

  it("recordReview가 일부 단어에서 실패해도 null을 반환한다 (부분 편입 가능 — 계약 주석 참조)", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1" }, { id: "v2" }]);
    recordReviewMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("db down"));

    const result = await enrollWordsToSrs("user-1", ["apple", "banana"]);

    expect(result).toBeNull();
  });
});
