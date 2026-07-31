// @vitest-environment node
/**
 * 읽기/듣기 갭 집계 — 표본 규칙과 창 규칙의 회귀.
 *
 * 지키는 것 셋.
 *   1) 표본 부족을 "갭 0" 으로 보여주지 않는 것(null 이어야 한다).
 *   2) 오디오를 끈 날(listeningCount = 0)이 듣기 표본에 섞이지 않는 것.
 *   3) 창(LISTENING_GAP_WINDOW)이 실제로 걸리는 것 — 창이 없으면 초기의 나쁜 세션이
 *      평균에 영구히 남아 갭이 좁혀져도 화면이 움직이지 않는다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    quizSession: { findMany: vi.fn() },
  },
}));

import prisma from "@/lib/db";
import { LISTENING_GAP_MIN_SESSIONS, LISTENING_GAP_WINDOW } from "@/shared/constants";
import { getListeningGap } from "./get-listening-gap";

const db = vi.mocked(prisma, true);
const USER_ID = "user-1";

interface SessionRow {
  readingCount: number;
  readingCorrect: number;
  listeningCount: number;
  listeningCorrect: number;
}

/** 읽기 7문항 중 r개 정답 · 듣기 3문항 중 l개 정답인 세션. */
function session(r: number, l: number): SessionRow {
  return { readingCount: 7, readingCorrect: r, listeningCount: 3, listeningCorrect: l };
}

function givenSessions(rows: SessionRow[]): void {
  db.quizSession.findMany.mockResolvedValue(rows as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("표본 규칙", () => {
  it("듣기 세션이 최소 표본 미만이면 null 이다 — 0 이 아니다", async () => {
    givenSessions(Array.from({ length: LISTENING_GAP_MIN_SESSIONS - 1 }, () => session(7, 2)));

    expect(await getListeningGap(USER_ID)).toBeNull();
  });

  it("최소 표본을 채우면 갭을 돌려준다", async () => {
    givenSessions(Array.from({ length: LISTENING_GAP_MIN_SESSIONS }, () => session(7, 2)));

    const result = await getListeningGap(USER_ID);

    expect(result).not.toBeNull();
  });

  it("세션이 하나도 없어도 던지지 않고 null 이다", async () => {
    givenSessions([]);

    expect(await getListeningGap(USER_ID)).toBeNull();
  });
});

describe("조회 조건", () => {
  it("listeningCount = 0 인 세션(오디오 토글로 끈 날)은 조회 자체에서 빠진다", async () => {
    givenSessions(Array.from({ length: LISTENING_GAP_MIN_SESSIONS }, () => session(7, 2)));

    await getListeningGap(USER_ID);

    expect(db.quizSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, listeningCount: { gt: 0 } },
      })
    );
  });

  it("최근 LISTENING_GAP_WINDOW 건까지만 본다 — 옛 세션은 창 밖으로 나간다", async () => {
    givenSessions(Array.from({ length: LISTENING_GAP_MIN_SESSIONS }, () => session(7, 2)));

    await getListeningGap(USER_ID);

    expect(db.quizSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: LISTENING_GAP_WINDOW,
      })
    );
  });

  it("창 크기를 넘겨 주더라도 집계는 받은 것만 센다", async () => {
    // 31건을 돌려주는 상황(창이 안 걸린 경우)을 재현해, 창 없이도 계산이 깨지지 않는지 본다.
    // 창 자체의 강제는 위 take 단언이 지킨다 — 그쪽이 빠지면 이 계산이 옛 세션까지 먹는다.
    const rows = [
      ...Array.from({ length: LISTENING_GAP_WINDOW }, () => session(7, 3)),
      session(0, 0), // 창 밖에 있어야 할 최악의 옛 세션
    ];
    givenSessions(rows);

    const result = await getListeningGap(USER_ID);

    // 31건을 다 먹었으므로 100% 가 아니다 — take 가 빠지면 이렇게 된다는 증거다.
    expect(result?.listeningRate).toBeLessThan(100);
  });
});

describe("정답률 계산", () => {
  it("읽기와 듣기를 분리해 센다", async () => {
    // 읽기 7문항 중 7정답(100%) · 듣기 3문항 중 2정답(약 67%)
    givenSessions(Array.from({ length: LISTENING_GAP_MIN_SESSIONS }, () => session(7, 2)));

    const result = await getListeningGap(USER_ID);

    expect(result?.readingRate).toBe(100);
    expect(result?.listeningRate).toBe(67);
    expect(result?.gap).toBe(33);
  });

  it("듣기가 읽기를 앞서면 갭이 음수다", async () => {
    givenSessions(
      Array.from({ length: LISTENING_GAP_MIN_SESSIONS }, () => ({
        readingCount: 7,
        readingCorrect: 3,
        listeningCount: 3,
        listeningCorrect: 3,
      }))
    );

    const result = await getListeningGap(USER_ID);

    expect(result?.gap).toBeLessThan(0);
  });

  it("세션마다 문항 수가 달라도 세션 평균이 아니라 문항 합계로 센다", async () => {
    // 큰 세션 1건(10문항 중 10정답)과 작은 세션들이 섞였을 때,
    // 세션 단위 평균을 내면 작은 세션이 과대 대표된다.
    givenSessions([
      { readingCount: 7, readingCorrect: 7, listeningCount: 30, listeningCorrect: 30 },
      ...Array.from({ length: LISTENING_GAP_MIN_SESSIONS - 1 }, () => ({
        readingCount: 7,
        readingCorrect: 7,
        listeningCount: 1,
        listeningCorrect: 0,
      })),
    ]);

    const result = await getListeningGap(USER_ID);

    // 문항 합계 기준: 39문항 중 30정답 = 77%. 세션 평균이면 (100 + 0*9)/10 = 10% 가 된다.
    expect(result?.listeningRate).toBe(77);
  });
});
