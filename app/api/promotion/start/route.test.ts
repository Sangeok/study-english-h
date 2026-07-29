// @vitest-environment node
/**
 * 승급 시작 라우트 — 자격 게이트가 세션 발급 지점임을 고정하고,
 * 세션 재사용·문항 제외·잠금 규약의 회귀를 방어한다.
 *
 * 진행률 집계(getLevelProgress)와 상태 파생(derivePromotionStatus)은 모킹하지 않는다 —
 * 자격 판정 전체가 실제로 도는지가 이 라우트의 핵심이다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    userProfile: { findUnique: vi.fn() },
    // getLevelProgress 가 쓰는 세 리더 (락 밖 읽기 전용)
    $queryRaw: vi.fn(),
    userQuizAttempt: { findMany: vi.fn() },
    userVocabulary: { count: vi.fn() },
    levelPromotionAttempt: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { PROMOTION } from "@/shared/constants";
import { POST } from "./route";

const USER_ID = "user-1";
const NOW = new Date("2026-07-24T12:00:00.000Z");
const FROM_LEVEL = "B1";
const TO_LEVEL = "B2";

/** 레벨당 문항 풀 — 실사용은 ~147개다. 중복 단어 제거 여지를 두고 30개로 만든다. */
const POOL = Array.from({ length: 30 }, (_, index) => ({
  id: `question-${index + 1}`,
  koreanHint: `hint-${index + 1}`,
  contextHintKo: null,
  englishWord: `word-${index + 1}`,
  sentence: `Sentence ${index + 1}`,
  sentenceAudioUrl: null,
  difficulty: TO_LEVEL,
  category: "daily",
  createdAt: NOW,
  options: [
    { id: `opt-${index}-a`, questionId: `question-${index + 1}`, text: "correct", isCorrect: true, order: 1 },
    { id: `opt-${index}-b`, questionId: `question-${index + 1}`, text: "wrong", isCorrect: false, order: 2 },
  ],
}));

type TransactionClientMock = {
  $queryRaw: ReturnType<typeof vi.fn>;
  levelPromotionSession: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  quizQuestion: { findMany: ReturnType<typeof vi.fn> };
};

const db = prisma as unknown as {
  userProfile: { findUnique: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
  userQuizAttempt: { findMany: ReturnType<typeof vi.fn> };
  userVocabulary: { count: ReturnType<typeof vi.fn> };
  levelPromotionAttempt: { findFirst: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};
const getSessionMock = vi.mocked(getSessionFromRequest);

type PromotionSessionRow = {
  id: string;
  userId: string;
  toLevel: string;
  questionIds: string[];
  createdAt: Date;
  consumedAt: Date | null;
};

let reusableSession: PromotionSessionRow | null;
let latestSession: { questionIds: string[] } | null;
let pool: typeof POOL;
let transactionCallOrder: string[];
let transactionClient: TransactionClientMock;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

function createStartRequest(): Request {
  return new Request("http://localhost/api/promotion/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

/** 진행률 100 — 성숙 합 100(A 만점) + 20회 전승(B 만점) + 부채 0 */
function makeEligible() {
  db.$queryRaw.mockResolvedValue([{ mastery: "mastered", count: 100 }]);
  db.userQuizAttempt.findMany.mockResolvedValue(
    Array.from({ length: 20 }, () => ({ isCorrect: true }))
  );
  db.userVocabulary.count.mockResolvedValue(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();

  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  transactionCallOrder = [];
  reusableSession = null;
  latestSession = null;
  pool = POOL;

  transactionClient = {
    $queryRaw: vi.fn().mockImplementation(async () => {
      transactionCallOrder.push("lock");
      return [{ lockResult: "" }];
    }),
    levelPromotionSession: {
      findFirst: vi.fn().mockImplementation(async (args: { where?: { consumedAt?: null } }) => {
        // 라우트는 두 번 조회한다: 재사용 후보(consumedAt: null 조건 포함) → 직전 세션(제외용)
        if (args?.where && "consumedAt" in args.where) {
          transactionCallOrder.push("find-reusable");
          return reusableSession;
        }
        transactionCallOrder.push("find-latest");
        return latestSession;
      }),
      create: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("create-session");
        return { id: "session-new" };
      }),
    },
    quizQuestion: {
      findMany: vi.fn().mockImplementation(async (args: { where?: { id?: { in: string[] } } }) => {
        transactionCallOrder.push("find-questions");
        const ids = args?.where?.id?.in;
        if (ids) return pool.filter((question) => ids.includes(question.id));
        return pool;
      }),
    },
  };

  db.userProfile.findUnique.mockResolvedValue({ level: FROM_LEVEL });
  db.levelPromotionAttempt.findFirst.mockResolvedValue(null);
  db.$transaction.mockImplementation(
    async (callback: (client: TransactionClientMock) => Promise<unknown>) =>
      callback(transactionClient)
  );
  getSessionMock.mockResolvedValue({
    user: { id: USER_ID },
  } as Awaited<ReturnType<typeof getSessionFromRequest>>);

  makeEligible();
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.useRealTimers();
});

describe("POST /api/promotion/start — 자격 게이트가 세션 발급 지점이다", () => {
  it("미인증이면 401 이고 트랜잭션을 열지 않는다", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(createStartRequest());

    expect(response.status).toBe(401);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("진행률 미달이면 403 locked 이고 세션을 만들지 않는다", async () => {
    db.$queryRaw.mockResolvedValue([]); // 성숙도 0 → 진행률 0

    const response = await POST(createStartRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.reason).toBe("locked");
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("쿨다운 중이면 403 cooldown 과 ISO availableAt 을 반환한다", async () => {
    const failedAt = new Date(NOW.getTime() - 60 * 1000);
    db.levelPromotionAttempt.findFirst.mockResolvedValue({ createdAt: failedAt });

    const response = await POST(createStartRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.reason).toBe("cooldown");
    expect(body.availableAt).toBe(
      new Date(failedAt.getTime() + PROMOTION.RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()
    );
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
  });

  it("최상위 레벨이면 403 max-level 이다", async () => {
    db.userProfile.findUnique.mockResolvedValue({ level: "C2" });

    const response = await POST(createStartRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.reason).toBe("max-level");
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/promotion/start — 세션 발급·재사용", () => {
  it("자격을 갖추면 세션 1건을 만들고 10문항과 sessionId 를 반환한다", async () => {
    const response = await POST(createStartRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessionId).toBe("session-new");
    expect(body.toLevel).toBe(TO_LEVEL);
    expect(body.questions).toHaveLength(PROMOTION.QUESTION_COUNT);
    expect(transactionClient.levelPromotionSession.create).toHaveBeenCalledOnce();
  });

  it("응답 옵션에 isCorrect 가 없다 (정답 노출 차단)", async () => {
    const response = await POST(createStartRequest());
    const body = await response.json();

    for (const question of body.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty("isCorrect");
        expect(Object.keys(option)).toEqual(["text"]);
      }
    }
  });

  it("유효 미소진 세션이 있으면 create 없이 같은 sessionId·같은 문항을 돌려준다", async () => {
    // 새로고침·StrictMode 이중 마운트가 진행 중 응시를 무효화하지 않는다는 회귀
    const issued = POOL.slice(0, PROMOTION.QUESTION_COUNT).map((question) => question.id);
    reusableSession = {
      id: "session-existing",
      userId: USER_ID,
      toLevel: TO_LEVEL,
      questionIds: issued,
      createdAt: NOW,
      consumedAt: null,
    };

    const response = await POST(createStartRequest());
    const body = await response.json();

    expect(body.sessionId).toBe("session-existing");
    expect(body.questions.map((question: { id: string }) => question.id)).toEqual(issued);
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
  });

  it("직전 세션이 낸 문항은 새 세션에서 제외한다 (암기 통과 차단)", async () => {
    const previous = POOL.slice(0, PROMOTION.QUESTION_COUNT).map((question) => question.id);
    latestSession = { questionIds: previous };

    await POST(createStartRequest());

    const created = transactionClient.levelPromotionSession.create.mock.calls[0][0];
    const intersection = created.data.questionIds.filter((id: string) => previous.includes(id));
    expect(intersection).toEqual([]);
  });

  it("같은 단어의 중복 문항은 한 번만 낸다", async () => {
    // 30문항이 모두 같은 단어면 중복 제거 후 1개만 남아 10개를 못 채운다
    pool = POOL.map((question) => ({ ...question, englishWord: "same-word" }));

    const response = await POST(createStartRequest());

    expect(response.status).toBe(503);
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
  });

  it("제외 후 부족하면 제외를 풀고 재시도한다", async () => {
    // 풀이 정확히 10개인데 직전 세션이 그 10개를 다 썼다면, 제외를 풀어야 응시가 가능하다
    pool = POOL.slice(0, PROMOTION.QUESTION_COUNT);
    latestSession = { questionIds: pool.map((question) => question.id) };

    const response = await POST(createStartRequest());

    expect(response.status).toBe(200);
    expect(transactionClient.levelPromotionSession.create).toHaveBeenCalledOnce();
  });

  it("풀이 10개 미만이면 세션을 만들지 않고 503 이다", async () => {
    pool = POOL.slice(0, 9);

    const response = await POST(createStartRequest());

    expect(response.status).toBe(503);
    expect(transactionClient.levelPromotionSession.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/promotion/start — 잠금 규약", () => {
  it("세션 조회·생성이 잠금 안에서 일어난다", async () => {
    await POST(createStartRequest());

    // 락이 트랜잭션의 첫 쿼리이고, 조회·생성이 그 뒤에 온다
    expect(transactionCallOrder[0]).toBe("lock");
    expect(transactionCallOrder).toContain("find-reusable");
    expect(transactionCallOrder).toContain("create-session");
    expect(transactionClient.$queryRaw.mock.calls[0][1]).toBe(`promotion:${USER_ID}`);
    expect(transactionClient.$queryRaw.mock.calls[0][0].join("?")).toContain(
      "pg_advisory_xact_lock"
    );
  });

  it("세션 조회·생성이 최상위 prisma 가 아니라 트랜잭션 클라이언트에서 호출된다", async () => {
    await POST(createStartRequest());

    expect(transactionClient.levelPromotionSession.findFirst).toHaveBeenCalled();
    expect(transactionClient.levelPromotionSession.create).toHaveBeenCalledOnce();
  });
});
