// @vitest-environment node
/**
 * 승급 제출 라우트 — 자격 게이트·치팅 표면·레벨 경합의 회귀 방어.
 *
 * 목 선례는 diagnosis/submit/route.test.ts 다(트랜잭션을 쓰는 유일한 선례).
 * quiz/submit·profile/stats 목을 베끼면 $transaction 이 없어 첫 줄에서 죽는다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    quizQuestion: { findMany: vi.fn() },
    // 승급은 UserQuizAttempt 를 읽지도 쓰지도 않는다 — 미호출 단언용으로만 존재한다.
    userQuizAttempt: { count: vi.fn(), findMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/features/flashcard/lib/srs-enrollment", () => ({
  enrollWordsToSrs: vi.fn(),
}));

import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { enrollWordsToSrs } from "@/features/flashcard/lib/srs-enrollment";
import { PROMOTION } from "@/shared/constants";
import { POST } from "./route";

const USER_ID = "user-1";
const NOW = new Date("2026-07-24T12:00:00.000Z");
const SESSION_ID = "session-1";
const FROM_LEVEL = "B1";
const TO_LEVEL = "B2";

const QUESTION_IDS = Array.from(
  { length: PROMOTION.QUESTION_COUNT },
  (_, index) => `question-${index + 1}`
);

const QUESTIONS = QUESTION_IDS.map((id, index) => ({
  id,
  koreanHint: `hint-${index + 1}`,
  contextHintKo: null,
  englishWord: `word-${index + 1}`,
  sentence: `Sentence ${index + 1}`,
  sentenceAudioUrl: null,
  difficulty: TO_LEVEL,
  category: "daily",
  createdAt: NOW,
  options: [
    { id: `opt-${index}-a`, questionId: id, text: "correct", isCorrect: true, order: 1 },
    { id: `opt-${index}-b`, questionId: id, text: "wrong", isCorrect: false, order: 2 },
  ],
}));

/** wrongCount 개만 오답으로 만든 답안 */
function buildAnswers(wrongCount = 0) {
  return QUESTION_IDS.map((questionId, index) => ({
    questionId,
    selectedText: index < wrongCount ? "wrong" : "correct",
  }));
}

type TransactionClientMock = {
  $queryRaw: ReturnType<typeof vi.fn>;
  levelPromotionSession: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  userProfile: {
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  levelPromotionAttempt: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const db = prisma as unknown as {
  quizQuestion: { findMany: ReturnType<typeof vi.fn> };
  userQuizAttempt: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};
const getSessionMock = vi.mocked(getSessionFromRequest);
const enrollMock = vi.mocked(enrollWordsToSrs);

let promotionSession: {
  id: string;
  userId: string;
  toLevel: string;
  questionIds: string[];
  createdAt: Date;
  consumedAt: Date | null;
} | null;
let currentLevel: string;
let lastFailedAt: Date | null;
let casCount: number;
let transactionCallOrder: string[];
let transactionClient: TransactionClientMock;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

function createSubmitRequest(body: unknown): Request {
  return new Request("http://localhost/api/promotion/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();

  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  transactionCallOrder = [];
  currentLevel = FROM_LEVEL;
  lastFailedAt = null;
  casCount = 1;
  promotionSession = {
    id: SESSION_ID,
    userId: USER_ID,
    toLevel: TO_LEVEL,
    questionIds: [...QUESTION_IDS],
    createdAt: NOW,
    consumedAt: null,
  };

  transactionClient = {
    $queryRaw: vi.fn().mockImplementation(async () => {
      transactionCallOrder.push("lock");
      return [{ lockResult: "" }];
    }),
    levelPromotionSession: {
      findUnique: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("find-session");
        return promotionSession;
      }),
      update: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("consume-session");
        return { id: SESSION_ID };
      }),
    },
    userProfile: {
      findUnique: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("find-profile");
        return { level: currentLevel };
      }),
      updateMany: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("cas");
        return { count: casCount };
      }),
    },
    levelPromotionAttempt: {
      findFirst: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("find-last-failed");
        return lastFailedAt ? { createdAt: lastFailedAt } : null;
      }),
      create: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("create-attempt");
        return { id: "attempt-1" };
      }),
    },
  };

  db.quizQuestion.findMany.mockResolvedValue(QUESTIONS);
  db.$transaction.mockImplementation(
    async (callback: (client: TransactionClientMock) => Promise<unknown>) =>
      callback(transactionClient)
  );
  getSessionMock.mockResolvedValue({
    user: { id: USER_ID },
  } as Awaited<ReturnType<typeof getSessionFromRequest>>);
  enrollMock.mockResolvedValue({ enrolledCount: 3 });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.useRealTimers();
});

describe("POST /api/promotion/submit — 형태 가드 (락 밖 fast-fail)", () => {
  it("미인증이면 401 이고 트랜잭션을 열지 않는다", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));

    expect(response.status).toBe(401);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("문항 수가 다르면 400 이고 트랜잭션을 열지 않는다", async () => {
    const response = await POST(
      createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers().slice(0, 9) })
    );

    expect(response.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("중복 questionId 는 400 이다", async () => {
    const answers = buildAnswers();
    answers[1] = { ...answers[0] };

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers }));

    expect(response.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("존재하지 않는 questionId 가 섞이면 400 이다", async () => {
    db.quizQuestion.findMany.mockResolvedValue(QUESTIONS.slice(0, 9));

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));

    expect(response.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/promotion/submit — 응시 세션 가드 (치팅 표면 차단)", () => {
  const cases: [string, () => void][] = [
    ["세션이 없으면", () => { promotionSession = null; }],
    ["다른 사용자의 세션이면", () => { promotionSession!.userId = "other-user"; }],
    ["이미 소진된 세션이면", () => { promotionSession!.consumedAt = NOW; }],
    [
      "TTL 을 넘긴 세션이면",
      () => {
        promotionSession!.createdAt = new Date(
          NOW.getTime() - (PROMOTION.SESSION_TTL_MINUTES + 1) * 60 * 1000
        );
      },
    ],
    [
      "제출 집합이 발급 집합과 다르면",
      () => {
        promotionSession!.questionIds = [...QUESTION_IDS.slice(0, 9), "question-999"];
      },
    ],
  ];

  it.each(cases)("%s 409 session-invalid 이고 레벨·기록을 쓰지 않는다", async (_label, mutate) => {
    mutate();

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reason).toBe("session-invalid");
    // 레벨 갱신은 updateMany 다 — update 에 단언하면 코드가 그 메서드를 안 써 무의미하게 통과한다.
    expect(transactionClient.userProfile.updateMany).not.toHaveBeenCalled();
    expect(transactionClient.levelPromotionAttempt.create).not.toHaveBeenCalled();
    expect(transactionClient.levelPromotionSession.update).not.toHaveBeenCalled();
  });
});

describe("POST /api/promotion/submit — 권위 검증", () => {
  it("레벨 드리프트는 409 level-changed 다 (400 이 아니다 — 복구가 '다시 시작'뿐이라)", async () => {
    currentLevel = "B2"; // 그새 승급/재진단으로 이동 → expected 가 C1 이 되어 세션 toLevel(B2)과 어긋남

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reason).toBe("level-changed");
    expect(transactionClient.userProfile.updateMany).not.toHaveBeenCalled();
  });

  it("최상위 레벨로 올라가 있으면 409 level-changed 다", async () => {
    currentLevel = "C2";

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reason).toBe("level-changed");
  });

  it("콘텐츠 드리프트(문항 difficulty ≠ 세션 toLevel)는 400 이다", async () => {
    db.quizQuestion.findMany.mockResolvedValue(
      QUESTIONS.map((question) => ({ ...question, difficulty: "C1" }))
    );

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));

    expect(response.status).toBe(400);
    expect(transactionClient.userProfile.updateMany).not.toHaveBeenCalled();
  });

  it("쿨다운 안이면 409 cooldown 이고 기록을 남기지 않는다 (응시권 미소모)", async () => {
    lastFailedAt = new Date(NOW.getTime() - 60 * 1000);

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reason).toBe("cooldown");
    expect(transactionClient.levelPromotionAttempt.create).not.toHaveBeenCalled();
    expect(transactionClient.levelPromotionSession.update).not.toHaveBeenCalled();
  });
});

describe("POST /api/promotion/submit — 채점", () => {
  it("통과하면 조건부 갱신(CAS)으로 레벨을 올리고 세션을 소진한다", async () => {
    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      passed: true,
      correctCount: PROMOTION.QUESTION_COUNT,
      newLevel: TO_LEVEL,
    });
    expect(transactionClient.userProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, level: FROM_LEVEL },
      data: { level: TO_LEVEL },
    });
    expect(transactionClient.levelPromotionAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        fromLevel: FROM_LEVEL,
        toLevel: TO_LEVEL,
        correctCount: PROMOTION.QUESTION_COUNT,
        passed: true,
      },
    });
    expect(transactionClient.levelPromotionSession.update).toHaveBeenCalledOnce();
    expect(enrollMock).not.toHaveBeenCalled();
  });

  it("CAS 가 0건이면 409 level-changed 로 롤백한다 (동시 재진단 경합)", async () => {
    casCount = 0;

    const response = await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reason).toBe("level-changed");
    // create 는 CAS 뒤에 오므로 호출조차 되지 않는다(트랜잭션도 롤백된다)
    expect(transactionClient.levelPromotionAttempt.create).not.toHaveBeenCalled();
  });

  it("미달이면 레벨을 올리지 않고 틀린 단어를 SRS 로 편입한다", async () => {
    const wrongCount = 3; // 7/10

    const response = await POST(
      createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers(wrongCount) })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ passed: false, correctCount: 7, enrolledCount: 3 });
    expect(transactionClient.userProfile.updateMany).not.toHaveBeenCalled();
    expect(transactionClient.levelPromotionAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        fromLevel: FROM_LEVEL,
        toLevel: TO_LEVEL,
        correctCount: 7,
        passed: false,
      },
    });
    // 세션은 채점 결과와 무관하게 소진된다
    expect(transactionClient.levelPromotionSession.update).toHaveBeenCalledOnce();
    expect(enrollMock).toHaveBeenCalledWith(
      USER_ID,
      QUESTIONS.slice(0, wrongCount).map((question) => ({
        word: question.englishWord,
        isCorrect: false,
        usedHint: false,
      }))
    );
  });

  it("편입이 실패해도(null) 채점 결과는 200 으로 반환한다 (best-effort)", async () => {
    enrollMock.mockResolvedValue(null);

    const response = await POST(
      createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers(3) })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.enrolledCount).toBeNull();
  });
});

describe("POST /api/promotion/submit — 잠금·격리 규약", () => {
  it("트랜잭션의 첫 쿼리가 promotion:<userId> advisory lock 이다", async () => {
    await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));

    expect(transactionCallOrder[0]).toBe("lock");
    // 태그드 템플릿: 0번이 문자열 조각, 1번이 첫 보간값
    expect(transactionClient.$queryRaw.mock.calls[0][1]).toBe(`promotion:${USER_ID}`);
    expect(transactionClient.$queryRaw.mock.calls[0][0].join("?")).toContain(
      "pg_advisory_xact_lock"
    );
  });

  it("세션 소비 → 레벨 권위 → 쿨다운 → CAS → 기록 → 소진 순서로 잠금 안에서 진행한다", async () => {
    await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));

    expect(transactionCallOrder).toEqual([
      "lock",
      "find-session",
      "find-profile",
      "find-last-failed",
      "cas",
      "create-attempt",
      "consume-session",
    ]);
  });

  it("어떤 경로에서도 UserQuizAttempt 를 읽지도 쓰지도 않는다 (데일리 완료 판정 오염 방지)", async () => {
    await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers() }));
    await POST(createSubmitRequest({ sessionId: SESSION_ID, answers: buildAnswers(3) }));

    expect(db.userQuizAttempt.count).not.toHaveBeenCalled();
    expect(db.userQuizAttempt.findMany).not.toHaveBeenCalled();
    expect(db.userQuizAttempt.createMany).not.toHaveBeenCalled();
  });
});
