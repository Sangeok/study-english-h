// @vitest-environment node
/**
 * 대시보드 기간 통계 — QuizSession 이관의 회귀.
 *
 * 이관 전에는 UserQuizAttempt 를 셌고, 그러면 리스닝·타이핑이 빠져 실제 활동의 일부만
 * 보여준다(읽기 5 / 듣기 3 / 쓰기 2 구성에서 50%). 이 파일이 지키는 것은
 * "문항 수·정답률·학습 시간이 세 유형 합계"라는 계약이다.
 *
 * 목 구성은 app/api/quiz/submit/route.test.ts 관례를 따른다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    quizSession: { aggregate: vi.fn() },
    flashcardSession: { aggregate: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

import prisma from "@/lib/db";
import { toKSTDateString } from "@/entities/user/lib/streak";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { GET } from "./route";

const USER_ID = "user-1";

/** 라우트가 KST 자정 기준으로 "오늘부터 N일 전"까지의 날짜 축을 만든다.
 *  날짜를 고정 문자열로 쓰면 그 날이 축을 벗어나는 순간 테스트가 깨지므로
 *  실행 시점의 오늘을 그대로 쓴다. */
const TODAY_KST = toKSTDateString(new Date());

const db = prisma as unknown as {
  quizSession: { aggregate: ReturnType<typeof vi.fn> };
  flashcardSession: { aggregate: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

/** 읽기 r문항 중 rc정답 · 듣기 l 중 lc · 쓰기 t 중 tc · 소요 d초 */
function quizSums(
  r: number,
  rc: number,
  l: number,
  lc: number,
  t: number,
  tc: number,
  d: number
) {
  return {
    _sum: {
      readingCount: r,
      readingCorrect: rc,
      listeningCount: l,
      listeningCorrect: lc,
      typingCount: t,
      typingCorrect: tc,
      durationSec: d,
    },
  };
}

/**
 * $queryRaw 는 세 번 불린다: 퀴즈 일별 · 플래시카드 일별 · 카테고리. 순서대로 돌려준다.
 *
 * mockReset 을 먼저 부르는 이유: mockResolvedValueOnce 의 큐는 vi.clearAllMocks() 로
 * 지워지지 않아 테스트 간에 누적된다. 그러면 뒤 테스트가 앞 테스트의 큐를 소비한다.
 */
function givenRawRows(quizDaily: unknown[], flashcardDaily: unknown[], categories: unknown[]) {
  db.$queryRaw.mockReset();
  db.$queryRaw
    .mockResolvedValueOnce(quizDaily)
    .mockResolvedValueOnce(flashcardDaily)
    .mockResolvedValueOnce(categories);
}

function request(period = "week"): Request {
  return new Request(`http://localhost/api/dashboard/period-stats?period=${period}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionFromRequest).mockResolvedValue({ user: { id: USER_ID } } as never);
  db.flashcardSession.aggregate.mockResolvedValue({
    _count: { _all: 0 },
    _sum: { duration: 0 },
  });
  givenRawRows([], [], []);
});

describe("문항 수·정답률 — 세 유형 합계", () => {
  it("읽기+듣기+쓰기를 합쳐 센다 — 읽기만 세면 절반이 사라진다", async () => {
    // 한 세션: 읽기 5 중 4정답 · 듣기 3 중 2 · 쓰기 2 중 1 = 10문항 중 7정답
    db.quizSession.aggregate.mockResolvedValue(quizSums(5, 4, 3, 2, 2, 1, 300));

    const body = await (await GET(request())).json();

    expect(body.totalQuizzes).toBe(10);
    expect(body.quizAccuracy).toBe(70);
  });

  it("학습 시간은 durationSec 합계다", async () => {
    db.quizSession.aggregate.mockResolvedValue(quizSums(5, 4, 3, 2, 2, 1, 300));

    const body = await (await GET(request())).json();

    expect(body.quizStudyTimeSec).toBe(300);
  });

  it("세션이 없으면 0 이고 정답률도 0 이다 — 0으로 나누지 않는다", async () => {
    db.quizSession.aggregate.mockResolvedValue(quizSums(0, 0, 0, 0, 0, 0, 0));

    const body = await (await GET(request())).json();

    expect(body.totalQuizzes).toBe(0);
    expect(body.quizAccuracy).toBe(0);
    expect(body.quizStudyTimeSec).toBe(0);
  });

  it("aggregate 가 null 을 돌려줘도 0 으로 떨어진다 — Prisma 는 행이 없으면 null 이다", async () => {
    db.quizSession.aggregate.mockResolvedValue({
      _sum: {
        readingCount: null,
        readingCorrect: null,
        listeningCount: null,
        listeningCorrect: null,
        typingCount: null,
        typingCorrect: null,
        durationSec: null,
      },
    });

    const body = await (await GET(request())).json();

    expect(body.totalQuizzes).toBe(0);
    expect(body.quizStudyTimeSec).toBe(0);
  });

  it("타이핑이 아직 안 나가는 기간(Phase 2 단독 배포)에도 동작한다", async () => {
    // typingCount 는 @default(0) 이라 Phase 3 이전 세션은 0 이다.
    db.quizSession.aggregate.mockResolvedValue(quizSums(7, 6, 3, 2, 0, 0, 240));

    const body = await (await GET(request())).json();

    expect(body.totalQuizzes).toBe(10);
    expect(body.quizAccuracy).toBe(80);
  });
});

describe("일별 집계", () => {
  it("하루 문항 수가 세 유형 합계다", async () => {
    db.quizSession.aggregate.mockResolvedValue(quizSums(5, 4, 3, 2, 2, 1, 300));
    // raw SQL 이 이미 합산해 돌려준다(SUM(reading + listening + typing)).
    givenRawRows([{ date: TODAY_KST, count: 10, total_time: 300 }], [], []);

    const body = await (await GET(request())).json();
    const today = body.dailyStats.find(
      (d: { date: string }) => d.date === TODAY_KST
    );

    expect(today?.quizCount).toBe(10);
  });

  it("활동이 없는 날도 0 으로 채워진다 — 차트가 끊기지 않는다", async () => {
    db.quizSession.aggregate.mockResolvedValue(quizSums(0, 0, 0, 0, 0, 0, 0));

    const body = await (await GET(request())).json();

    expect(body.dailyStats).toHaveLength(7); // week
    expect(body.dailyStats.every((d: { quizCount: number }) => d.quizCount === 0)).toBe(true);
  });
});

describe("가드", () => {
  it("미인증이면 401", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null as never);

    expect((await GET(request())).status).toBe(401);
  });

  it("유효하지 않은 period 는 400", async () => {
    db.quizSession.aggregate.mockResolvedValue(quizSums(0, 0, 0, 0, 0, 0, 0));

    expect((await GET(request("century"))).status).toBe(400);
  });
});
