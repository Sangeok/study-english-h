// @vitest-environment node
/**
 * 프로필 통계 라우트 — 어휘 통계 라이브 집계 배선 회귀 방어.
 *
 * getVocabularyStats 는 의도적으로 모킹하지 않는다(라우트+집계 통합 검증).
 * 이 파일에 vi.mock("@/entities/user", ...) 를 추가하면 성공 기준 2가 조용히 사라진다 —
 * 집계 자체의 쿼리 형태 검증은 entities/user/api/get-vocabulary-stats.test.ts 가 소유한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    userProfile: { findUnique: vi.fn(), create: vi.fn() },
    levelDiagnosis: { findFirst: vi.fn() },
    userQuizAttempt: { count: vi.fn() },
    userVocabulary: { groupBy: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { GET } from "./route";

const USER_ID = "user-1";

// 컬럼은 라이브 값(5/2/4)과 겹치지 않는 낡은 값 — 응답이 컬럼을 읽으면 모든 케이스가 실패한다.
// 0 으로 두면 "빈 어휘" 케이스가 컬럼 경로에서도 통과해 회귀를 못 잡는다.
const STALE_PROFILE = {
  level: "B1",
  totalXP: 500,
  currentStreak: 3,
  longestStreak: 5,
  lastStudyDate: new Date("2026-07-24T00:00:00.000Z"),
  weaknessAreas: null,
  totalWordLearned: 7,
  masteredWords: 6,
  reviewNeeded: 9,
};

const db = prisma as unknown as {
  userProfile: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  levelDiagnosis: { findFirst: ReturnType<typeof vi.fn> };
  userQuizAttempt: { count: ReturnType<typeof vi.fn> };
  userVocabulary: { groupBy: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
};
const getSessionMock = vi.mocked(getSessionFromRequest);
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

function createStatsRequest(): Request {
  return new Request("http://localhost/api/profile/stats");
}

beforeEach(() => {
  vi.clearAllMocks();
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  db.userProfile.findUnique.mockResolvedValue(STALE_PROFILE);
  db.userProfile.create.mockResolvedValue({ userId: USER_ID, level: "A1", totalXP: 0 });
  db.levelDiagnosis.findFirst.mockResolvedValue({ id: "diag-1" });
  db.userQuizAttempt.count.mockResolvedValue(0);
  // 두 버킷 — totalWordLearned(5)와 masteredWords(2)가 달라야 두 필드 뒤바뀜을 잡는다
  db.userVocabulary.groupBy.mockResolvedValue([
    { masteryLevel: "mastered", _count: 2 },
    { masteryLevel: "learning", _count: 3 },
  ]);
  db.userVocabulary.count.mockResolvedValue(4);
  getSessionMock.mockResolvedValue({
    user: { id: USER_ID },
  } as Awaited<ReturnType<typeof getSessionFromRequest>>);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("GET /api/profile/stats — 어휘 통계 라이브 집계", () => {
  it("reviewNeeded 는 컬럼(9)이 아니라 라이브 count(4)를 반환한다", async () => {
    const response = await GET(createStatsRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewNeeded).toBe(4);
  });

  it("totalWordLearned·masteredWords·vocabularyProgress 가 라이브 집계에서 온다", async () => {
    const response = await GET(createStatsRequest());
    const body = await response.json();

    expect(body.totalWordLearned).toBe(5); // 컬럼이면 7
    expect(body.masteredWords).toBe(2); // 컬럼이면 6
    expect(body.vocabularyProgress).toBe(40); // 컬럼이면 round(6/7*100)=86
  });

  it("어휘가 없으면 세 값과 진행률 모두 0 이다", async () => {
    db.userVocabulary.groupBy.mockResolvedValue([]);
    db.userVocabulary.count.mockResolvedValue(0);

    const response = await GET(createStatsRequest());
    const body = await response.json();

    expect(body.totalWordLearned).toBe(0);
    expect(body.masteredWords).toBe(0);
    expect(body.reviewNeeded).toBe(0);
    expect(body.vocabularyProgress).toBe(0);
  });

  it("프로필이 없어도 어휘 필드는 하드코딩 0 이 아니라 라이브 집계를 반환한다", async () => {
    db.userProfile.findUnique.mockResolvedValue(null);

    const response = await GET(createStatsRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(db.userProfile.create).toHaveBeenCalledOnce();
    expect(body.totalWordLearned).toBe(5);
    expect(body.masteredWords).toBe(2);
    expect(body.reviewNeeded).toBe(4);
    expect(body.vocabularyProgress).toBe(40);
  });

  it("미인증이면 401 을 반환하고 집계를 실행하지 않는다", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(createStatsRequest());

    expect(response.status).toBe(401);
    expect(db.userVocabulary.groupBy).not.toHaveBeenCalled();
    expect(db.userVocabulary.count).not.toHaveBeenCalled();
  });

  it("집계가 실패하면 500 과 에러 로그를 남긴다", async () => {
    db.userVocabulary.groupBy.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(createStatsRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "통계 조회 중 오류가 발생했습니다" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Profile stats error:", expect.any(Error));
  });
});
