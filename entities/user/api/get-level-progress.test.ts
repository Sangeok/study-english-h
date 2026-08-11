// @vitest-environment node
/**
 * 진행률 집계 배선 회귀 방어 — 결과값 자체는 순수 함수 테스트(lib/level-progress.test.ts)가 소유한다.
 * 여기서 재는 것은 "어떤 쿼리를 어떤 인자로 던지는가"와 "성숙 문자열 → 점수 매핑"뿐이다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    $queryRaw: vi.fn(),
    userQuizAttempt: { findMany: vi.fn() },
    userVocabulary: { count: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { LEVEL_PROGRESS } from "@/shared/constants";
import { getReviewDueFilter } from "../lib/review-due";
import { getLevelProgress } from "./get-level-progress";

const db = prisma as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>;
  userQuizAttempt: { findMany: ReturnType<typeof vi.fn> };
  userVocabulary: { count: ReturnType<typeof vi.fn> };
};

const USER_ID = "user-1";
const NOW = new Date("2026-07-24T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  db.$queryRaw.mockResolvedValue([]);
  db.userQuizAttempt.findMany.mockResolvedValue([]);
  db.userVocabulary.count.mockResolvedValue(0);
});

describe("getLevelProgress (집계 배선)", () => {
  it("최근 시도는 현재 레벨 문항만, ACCURACY_WINDOW 개까지, 최신순으로 읽는다", async () => {
    await getLevelProgress(USER_ID, "B1", NOW);

    expect(db.userQuizAttempt.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, question: { difficulty: "B1" } },
      orderBy: { attemptedAt: "desc" },
      take: LEVEL_PROGRESS.ACCURACY_WINDOW,
      select: { isCorrect: true },
    });
  });

  it("복습 부채는 주입된 now 기준 도래 술어로 센다 (get-vocabulary-stats 와 동일 정의)", async () => {
    await getLevelProgress(USER_ID, "B1", NOW);

    expect(db.userVocabulary.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, nextReviewDate: getReviewDueFilter(NOW) },
    });
  });

  it("성숙도 raw SQL 에 userId 와 레벨을 바인딩한다", async () => {
    await getLevelProgress(USER_ID, "B1", NOW);

    // 태그드 템플릿: 0번이 문자열 조각 배열, 이후가 보간값
    const [fragments, ...values] = db.$queryRaw.mock.calls[0];
    expect(fragments.join("?")).toContain("user_vocabularies");
    expect(fragments.join("?")).toContain("vocabularies");
    expect(values).toEqual([USER_ID, "B1"]);
  });

  it("성숙 단계별 가중 합을 낸다 — mastered 1 · reviewing ⅔ · learning ⅓", async () => {
    // 합 = 30*1 + 30*(2/3) + 30*(1/3) = 60 → A = 60, B = 0 → round(0.6*60) = 36
    db.$queryRaw.mockResolvedValue([
      { mastery: "mastered", count: 30 },
      { mastery: "reviewing", count: 30 },
      { mastery: "learning", count: 30 },
    ]);

    expect(await getLevelProgress(USER_ID, "B1", NOW)).toBe(36);
  });

  it("MASTERY_SCORE 에 없는 문자열은 0 으로 떨어뜨린다 (NaN 방지)", async () => {
    // 미지 키가 undefined 로 곱해지면 NaN → JSON null 이 되는 조용한 진행바 버그를 막는다
    db.$queryRaw.mockResolvedValue([
      { mastery: "mastered", count: 50 },
      { mastery: "존재하지-않는-단계", count: 999 },
    ]);

    // 미지 키가 무시되면 A = 50 → round(0.6*50) = 30
    expect(await getLevelProgress(USER_ID, "B1", NOW)).toBe(30);
  });

  it("정답률은 isCorrect 개수에서 나오고 볼륨 감쇠가 걸린다", async () => {
    // 10회 중 10정답 → correctRate 100, volumeFactor 10/20 = 0.5 → accuracyScore 50
    //   → round(0.6*0 + 0.4*50) = 20
    db.userQuizAttempt.findMany.mockResolvedValue(
      Array.from({ length: 10 }, () => ({ isCorrect: true }))
    );

    expect(await getLevelProgress(USER_ID, "B1", NOW)).toBe(20);
  });
});
