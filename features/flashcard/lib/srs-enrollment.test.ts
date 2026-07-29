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
import { enrollWordsToSrs, type QuizWordOutcome } from "./srs-enrollment";

const db = prisma as unknown as {
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
};
const recordReviewMock = recordReview as unknown as ReturnType<typeof vi.fn>;

function wrong(word: string): QuizWordOutcome {
  return { word, isCorrect: false, usedHint: false };
}
function hintedCorrect(word: string): QuizWordOutcome {
  return { word, isCorrect: true, usedHint: true };
}
function cleanCorrect(word: string): QuizWordOutcome {
  return { word, isCorrect: true, usedHint: false };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.vocabulary.findMany.mockResolvedValue([]);
  recordReviewMock.mockResolvedValue({});
});

describe("enrollWordsToSrs (퀴즈 편입)", () => {
  it("정규화·중복 제거 후 insensitive 조회한다", async () => {
    await enrollWordsToSrs("user-1", [
      wrong(" Apple"),
      wrong("apple"),
      cleanCorrect("banana"),
      wrong(""),
    ]);

    expect(db.vocabulary.findMany).toHaveBeenCalledWith({
      where: { word: { in: ["apple", "banana"], mode: "insensitive" } },
      select: { id: true, word: true },
    });
  });

  // 확신도 → 첫 복습 시점: repetitions 시드가 DEFAULT_INTERVALS(1·3·7일)를 결정한다.
  it("오답은 forgot/isCorrect=false 로 편입한다 (1일)", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple" }]);

    await enrollWordsToSrs("user-1", [wrong("apple")]);

    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "forgot", false, 0);
  });

  it("힌트를 쓴 정답은 repetitions 1 로 시드해 편입한다 (3일)", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple" }]);

    await enrollWordsToSrs("user-1", [hintedCorrect("apple")]);

    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "hard", true, 1);
  });

  it("힌트 없는 정답은 repetitions 2 로 시드해 편입한다 (7일)", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple" }]);

    await enrollWordsToSrs("user-1", [cleanCorrect("apple")]);

    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "normal", true, 2);
  });

  it("정답도 편입한다 — 편입 수는 오답 수가 아니라 만난 단어 수다", async () => {
    db.vocabulary.findMany.mockResolvedValue([
      { id: "v1", word: "apple" },
      { id: "v2", word: "banana" },
    ]);

    const result = await enrollWordsToSrs("user-1", [
      wrong("apple"),
      cleanCorrect("banana"),
      // 미연결 단어는 조회에서 탈락한다
      cleanCorrect("burn the midnight oil"),
    ]);

    expect(recordReviewMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ enrolledCount: 2 });
  });

  it("한 퀴즈에 같은 단어가 두 번 나오면 보수적인 신호를 남긴다 (오답 우선)", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "apple" }]);

    await enrollWordsToSrs("user-1", [cleanCorrect("apple"), wrong("Apple")]);

    expect(recordReviewMock).toHaveBeenCalledTimes(1);
    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "forgot", false, 0);
  });

  it("DB 의 단어 표기가 달라도 정규화해 확신도를 매칭한다", async () => {
    db.vocabulary.findMany.mockResolvedValue([{ id: "v1", word: "Apple" }]);

    await enrollWordsToSrs("user-1", [hintedCorrect("apple")]);

    expect(recordReviewMock).toHaveBeenCalledWith("user-1", "v1", "hard", true, 1);
  });

  it("빈 입력이면 조회 없이 0을 반환한다", async () => {
    const result = await enrollWordsToSrs("user-1", []);

    expect(db.vocabulary.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ enrolledCount: 0 });
  });

  it("조회 실패 시 null을 반환한다 (best-effort 계약)", async () => {
    db.vocabulary.findMany.mockRejectedValue(new Error("db down"));

    const result = await enrollWordsToSrs("user-1", [wrong("apple")]);

    expect(result).toBeNull();
  });

  it("recordReview가 일부 단어에서 실패해도 null을 반환한다 (부분 편입 가능 — 계약 주석 참조)", async () => {
    db.vocabulary.findMany.mockResolvedValue([
      { id: "v1", word: "apple" },
      { id: "v2", word: "banana" },
    ]);
    recordReviewMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("db down"));

    const result = await enrollWordsToSrs("user-1", [wrong("apple"), wrong("banana")]);

    expect(result).toBeNull();
  });
});
