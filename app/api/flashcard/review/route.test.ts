// @vitest-environment node
/**
 * 플래시카드 복습 제출 — 자기평가 신호를 서버가 파생하는지 지킨다.
 *
 * 플래시카드에는 채점이 없다. 클라이언트가 보내는 isCorrect 는 quality 에서 파생된 값일
 * 뿐이므로 서버가 그것을 신뢰하면 quality 와 어긋난 상태가 SRS 에 들어갈 수 있다
 * ("잊음"으로 집계되면서 동시에 간격이 늘어나는 카드). 그 경로를 여기서 막는다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: { $transaction: vi.fn() },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/entities/user", () => ({
  getStreakUpdateData: vi.fn(),
}));

vi.mock("@/features/flashcard/lib/srs-service", () => ({
  recordReview: vi.fn(),
  updateProfileStats: vi.fn(),
}));

vi.mock("@/features/gamification/lib/gamification-engine", () => ({
  processGamificationRewards: vi.fn(),
}));

import prisma from "@/lib/db";
import { getStreakUpdateData } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { recordReview } from "@/features/flashcard/lib/srs-service";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { POST } from "./route";

const USER_ID = "user-1";

const db = prisma as unknown as { $transaction: ReturnType<typeof vi.fn> };
const mockRecordReview = recordReview as unknown as ReturnType<typeof vi.fn>;

/** route 는 req.json() 만 사용한다 — 나머지 필드는 목이 가로챈다. */
const request = (body: unknown) =>
  ({ json: async () => body }) as unknown as NextRequest;

const reviewBody = (
  reviews: Array<{ vocabularyId: string; quality: string; isCorrect: boolean }>
) => ({
  reviews: reviews.map((r) => ({ ...r, timeSpent: 5 })),
  mode: "flashcard",
  duration: 30,
});

beforeEach(() => {
  vi.clearAllMocks();

  (getSessionFromRequest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: USER_ID },
  });
  mockRecordReview.mockResolvedValue({
    masteryLevel: "new",
    nextReviewDate: new Date("2026-08-12T04:00:00.000Z"),
  });
  (getStreakUpdateData as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    lastStudyDate: new Date("2026-08-11T00:00:00.000Z"),
    currentStreak: 1,
    longestStreak: 1,
    newFreezeCount: 0,
  });
  (processGamificationRewards as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
  db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      flashcardSession: { create: vi.fn() },
      userProfile: { upsert: vi.fn() },
    })
  );
});

describe("POST /api/flashcard/review — 자기평가 신호의 출처", () => {
  it("quality 가 forgot 이면 클라이언트가 isCorrect: true 를 보내도 lapse 로 기록한다", async () => {
    await POST(request(reviewBody([{ vocabularyId: "v1", quality: "forgot", isCorrect: true }])));

    // recordReview(userId, vocabularyId, quality, isCorrect)
    expect(mockRecordReview).toHaveBeenCalledWith(USER_ID, "v1", "forgot", false);
  });

  it("quality 가 forgot 이 아니면 클라이언트가 isCorrect: false 를 보내도 기억함으로 기록한다", async () => {
    await POST(request(reviewBody([{ vocabularyId: "v1", quality: "hard", isCorrect: false }])));

    expect(mockRecordReview).toHaveBeenCalledWith(USER_ID, "v1", "hard", true);
  });

  it("위조된 isCorrect 로 XP 를 받을 수 없다", async () => {
    const response = await POST(
      request(reviewBody([{ vocabularyId: "v1", quality: "forgot", isCorrect: true }]))
    );
    const body = await response.json();

    expect(body.summary.remembered).toBe(0);
    expect(body.summary.xpEarned).toBe(0);
  });

  it("분포 집계는 quality 를 그대로 따른다", async () => {
    const response = await POST(
      request(
        reviewBody([
          { vocabularyId: "v1", quality: "easy", isCorrect: true },
          { vocabularyId: "v2", quality: "forgot", isCorrect: true },
        ])
      )
    );
    const body = await response.json();

    expect(body.summary.breakdown).toEqual({ easy: 1, normal: 0, hard: 0, forgot: 1 });
    expect(body.summary.remembered).toBe(1);
  });
});
