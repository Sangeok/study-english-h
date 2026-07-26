// @vitest-environment node
/**
 * 퀴즈 제출 라우트 — SRS 오답 편입 배선 회귀 방어.
 *
 * 지키는 것: 라우트가 오답을 어떻게 모아 편입에 넘기고, 결과를 응답에 싣는가.
 * 편입 실패는 UI에서 카드를 숨기는 것으로 흡수되므로(quiz-srs-notice.tsx) 배선이 끊겨도
 * 에러도 화면 변화도 없다 — 이 파일이 유일한 신호다.
 *
 * 지키지 않는 것: recordReview 의 upsert 의미론과 getDueVocabularies 조회.
 * DB 왕복 검증에는 테스트 DB 계층이 필요하나 저장소에 아직 없다(staging seed 작업 시 함께 도입 예정).
 * 편입 함수 자체의 no-throw 계약은 srs-enrollment.test.ts 가 담당한다 — 라우트는 그 계약에 의존하며
 * 여기서 재검증하지 않는다(계약이 깨지면 이 라우트는 500 을 반환한다).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    quizQuestion: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/entities/user", () => ({
  getStreakUpdateData: vi.fn(),
}));

vi.mock("@/features/gamification/lib/gamification-engine", () => ({
  processGamificationRewards: vi.fn(),
}));

vi.mock("@/features/flashcard/lib/srs-enrollment", () => ({
  enrollWordsToSrs: vi.fn(),
}));

import prisma from "@/lib/db";
import { getStreakUpdateData } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { enrollWordsToSrs } from "@/features/flashcard/lib/srs-enrollment";
import { POST } from "./route";

const USER_ID = "user-1";

/** 정답 옵션 텍스트 — 답안이 이 값이면 정답, 아니면 오답이다. */
function correctTextOf(questionId: string): string {
  return `correct-${questionId}`;
}

function makeQuestion(questionId: string, englishWord: string) {
  return {
    id: questionId,
    koreanHint: `hint-${questionId}`,
    contextHintKo: null,
    englishWord,
    sentence: `Sentence for ${englishWord}`,
    sentenceAudioUrl: null,
    difficulty: "A1",
    category: "daily",
    createdAt: new Date("2026-07-24T00:00:00.000Z"),
    options: [
      {
        id: `option-${questionId}`,
        questionId,
        text: correctTextOf(questionId),
        isCorrect: true,
        order: 1,
      },
    ],
  };
}

// q2·q3 이 오답이 되도록 답안을 구성한다. q-bogus 는 DB 에 없는 questionId.
const QUESTIONS = [
  makeQuestion("q1", "apple"),
  makeQuestion("q2", "banana"),
  makeQuestion("q3", "cherry"),
  makeQuestion("q4", "durian"),
];

const ANSWERS = [
  { questionId: "q1", selectedAnswer: correctTextOf("q1"), hintLevel: 0 as const, timeSpent: 5 },
  { questionId: "q2", selectedAnswer: "틀린 답", hintLevel: 0 as const, timeSpent: 5 },
  { questionId: "q3", selectedAnswer: "틀린 답", hintLevel: 1 as const, timeSpent: 5 },
  { questionId: "q4", selectedAnswer: correctTextOf("q4"), hintLevel: 0 as const, timeSpent: 5 },
  { questionId: "q-bogus", selectedAnswer: "무엇이든", hintLevel: 0 as const, timeSpent: 5 },
];

const WRONG_WORDS = ["banana", "cherry"];

const STREAK_DATA = {
  lastStudyDate: new Date("2026-07-24T00:00:00.000Z"),
  currentStreak: 1,
  longestStreak: 1,
  freezeUsed: false,
  newFreezeCount: 0,
};

const GAMIFICATION_RESULT = {
  leaguePoints: 30,
  promoted: false,
  newTierName: null,
  milestones: [],
  newAchievements: [],
};

type TransactionClientMock = {
  userQuizAttempt: {
    count: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  userProfile: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

const db = prisma as unknown as {
  quizQuestion: { findMany: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};
const getSessionMock = vi.mocked(getSessionFromRequest);
const getStreakUpdateDataMock = vi.mocked(getStreakUpdateData);
const processGamificationRewardsMock = vi.mocked(processGamificationRewards);
const enrollWordsToSrsMock = vi.mocked(enrollWordsToSrs);

let transactionClient: TransactionClientMock;

function createSubmitRequest(): Request {
  return new Request("http://localhost/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: ANSWERS }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  transactionClient = {
    userQuizAttempt: {
      // 0 이면 오늘 첫 제출(isExtraPractice=false)
      count: vi.fn().mockResolvedValue(0),
      createMany: vi.fn().mockResolvedValue({ count: 4 }),
    },
    userProfile: {
      findUnique: vi.fn().mockResolvedValue({ freeHintCount: 0, xpBoostCharges: 0 }),
      upsert: vi.fn().mockResolvedValue({ id: "profile-1", userId: USER_ID }),
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
  getStreakUpdateDataMock.mockResolvedValue(STREAK_DATA);
  processGamificationRewardsMock.mockResolvedValue(GAMIFICATION_RESULT);
  enrollWordsToSrsMock.mockResolvedValue({ enrolledCount: WRONG_WORDS.length });
});

describe("POST /api/quiz/submit — SRS 오답 편입", () => {
  it("오답 단어만 편입 후보로 전달한다 (정답·미존재 questionId 제외)", async () => {
    const response = await POST(createSubmitRequest());

    expect(response.status).toBe(200);
    expect(enrollWordsToSrsMock).toHaveBeenCalledOnce();
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, WRONG_WORDS);
  });

  it("추가 연습에서도 오답을 편입한다 (오답은 보상이 아니라 학습 신호)", async () => {
    // 오늘 이미 제출함 → isExtraPractice=true → XP 는 0 이지만 편입은 그대로 수행되어야 한다
    transactionClient.userQuizAttempt.count.mockResolvedValue(1);

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.isExtraPractice).toBe(true);
    expect(body.summary.xpEarned).toBe(0);
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, WRONG_WORDS);
  });

  it("편입 결과를 summary.srs 로 응답한다", async () => {
    enrollWordsToSrsMock.mockResolvedValue({ enrolledCount: 2 });

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(body.summary.srs).toEqual({ enrolledCount: 2 });
  });

  it("편입이 실패(null)해도 퀴즈 제출은 200 이고 srs 만 null 이다", async () => {
    enrollWordsToSrsMock.mockResolvedValue(null);

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.srs).toBeNull();
    // 편입 실패가 채점·XP·attempt 기록을 훼손하지 않는다
    expect(body.summary.correct).toBe(2);
    expect(transactionClient.userQuizAttempt.createMany).toHaveBeenCalledOnce();
  });

  it("게이미피케이션이 실패해도 오답 편입은 먼저 실행된다 (편입/게이미피케이션 순서 회귀 방어)", async () => {
    // processGamificationRewards 는 실패 격리가 없어 throw 하면 500 이 되지만,
    // 편입은 자기완결(비-throw)이라 게이미피케이션보다 먼저 실행돼 그 실패에 종속되지 않아야 한다.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processGamificationRewardsMock.mockRejectedValue(new Error("gamification down"));

    const response = await POST(createSubmitRequest());

    expect(response.status).toBe(500); // 게이미피케이션 실패 자체는 여전히 500
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, WRONG_WORDS); // 그러나 편입은 실행됨

    consoleErrorSpy.mockRestore();
  });
});
