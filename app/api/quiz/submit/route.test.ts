// @vitest-environment node
/**
 * 퀴즈 제출 라우트 — SRS 퀴즈 편입 배선 회귀 방어.
 *
 * 지키는 것: 라우트가 만난 단어를 어떻게 모아(정답 여부·힌트 사용 포함) 편입에 넘기고,
 * 결과를 응답에 싣는가.
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
    // 리스닝 채점의 서버 재조회 — 트랜잭션 *이전* 에 일어나므로 db 목이지 tx 목이 아니다.
    vocabulary: { findMany: vi.fn() },
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

// 정답·오답을 가리지 않고 만난 단어 전부가 편입 후보다(ADR 0002).
// 확신도는 편입 여부가 아니라 첫 복습 시점을 가르므로 isCorrect·usedHint 가 함께 전달돼야 한다.
const ENROLL_OUTCOMES = [
  { word: "apple", isCorrect: true, usedHint: false },
  { word: "banana", isCorrect: false, usedHint: false },
  { word: "cherry", isCorrect: false, usedHint: true },
  { word: "durian", isCorrect: true, usedHint: false },
];

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
  quizSession: { create: ReturnType<typeof vi.fn> };
};

const db = prisma as unknown as {
  quizQuestion: { findMany: ReturnType<typeof vi.fn> };
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
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
    // 세션 기록 — 트랜잭션 말미의 새 쓰기 경로. 목이 없으면 전 케이스가 500 으로 깨진다.
    quizSession: { create: vi.fn().mockResolvedValue({ id: "session-1" }) },
  };

  db.quizQuestion.findMany.mockResolvedValue(QUESTIONS);
  db.vocabulary.findMany.mockResolvedValue([]);
  db.$transaction.mockImplementation(
    async (callback: (client: TransactionClientMock) => Promise<unknown>) =>
      callback(transactionClient)
  );
  getSessionMock.mockResolvedValue({
    user: { id: USER_ID },
  } as Awaited<ReturnType<typeof getSessionFromRequest>>);
  getStreakUpdateDataMock.mockResolvedValue(STREAK_DATA);
  processGamificationRewardsMock.mockResolvedValue(GAMIFICATION_RESULT);
  enrollWordsToSrsMock.mockResolvedValue({ enrolledCount: ENROLL_OUTCOMES.length });
});

describe("POST /api/quiz/submit — SRS 퀴즈 편입", () => {
  it("만난 단어 전부를 확신도(정답 여부·힌트 사용)와 함께 전달한다 (미존재 questionId 제외)", async () => {
    const response = await POST(createSubmitRequest());

    expect(response.status).toBe(200);
    expect(enrollWordsToSrsMock).toHaveBeenCalledOnce();
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, ENROLL_OUTCOMES);
  });

  it("추가 연습에서도 편입한다 (편입은 보상이 아니라 학습 신호)", async () => {
    // 오늘 이미 제출함 → isExtraPractice=true → XP 는 0 이지만 편입은 그대로 수행되어야 한다
    transactionClient.userQuizAttempt.count.mockResolvedValue(1);

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.isExtraPractice).toBe(true);
    expect(body.summary.xpEarned).toBe(0);
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, ENROLL_OUTCOMES);
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

  it("게이미피케이션이 실패해도 편입은 먼저 실행된다 (편입/게이미피케이션 순서 회귀 방어)", async () => {
    // processGamificationRewards 는 실패 격리가 없어 throw 하면 500 이 되지만,
    // 편입은 자기완결(비-throw)이라 게이미피케이션보다 먼저 실행돼 그 실패에 종속되지 않아야 한다.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processGamificationRewardsMock.mockRejectedValue(new Error("gamification down"));

    const response = await POST(createSubmitRequest());

    expect(response.status).toBe(500); // 게이미피케이션 실패 자체는 여전히 500
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, ENROLL_OUTCOMES); // 그러나 편입은 실행됨

    consoleErrorSpy.mockRestore();
  });
});

/**
 * 리스닝 합류 — 유형 분리·집계 합계화·프리 힌트 우선순위의 회귀.
 *
 * 위 블록이 `type` 없는 옛 형태로 제출하고 단언 수정 없이 통과하는 것이 하위호환의 증거다.
 * 여기부터는 리스닝이 섞인 제출을 다룬다.
 */
const VOCABULARIES = [
  { id: "v1", word: "borrow", meaning: "빌리다" },
  { id: "v2", word: "freeze", meaning: "얼다" },
  { id: "v3", word: "launch", meaning: "출시하다" },
];

/** 타이핑 결과 행이 예문·예문 오디오를 쓰므로 조회 필드가 더 넓다. */
const TYPING_VOCABULARIES = VOCABULARIES.map((v) => ({
  ...v,
  exampleSentence: `I will ${v.word} it.`,
  exampleAudioUrl: `https://cdn.test/${v.id}-ex.mp3`,
}));

function typingAnswer(
  vocabularyId: string,
  typedAnswer: string,
  audioPlayed = false,
  hintLevel: 0 | 1 | 2 = 0
) {
  return { type: "typing" as const, vocabularyId, typedAnswer, audioPlayed, timeSpent: 5, hintLevel };
}

function listeningAnswer(
  vocabularyId: string,
  selectedMeaning: string,
  hintLevel: 0 | 1 | 2 = 0,
  autoDegraded?: true
) {
  return {
    type: "listening" as const,
    vocabularyId,
    selectedMeaning,
    timeSpent: 5,
    hintLevel,
    ...(autoDegraded ? { autoDegraded } : {}),
  };
}

/** 두 번째 인자 이름이 listening 인 것은 유래 때문이고, 지금은 리스닝·타이핑을 함께 받는다. */
function createMixedRequest(
  listening: (ReturnType<typeof listeningAnswer> | ReturnType<typeof typingAnswer>)[],
  reading: unknown[] = ANSWERS
): Request {
  return new Request("http://localhost/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: [...reading, ...listening] }),
  });
}

describe("POST /api/quiz/submit — 리스닝 합류", () => {
  beforeEach(() => {
    db.vocabulary.findMany.mockResolvedValue(VOCABULARIES);
  });

  it("리스닝 답안은 UserQuizAttempt 에 들어가지 않는다", async () => {
    await POST(createMixedRequest([listeningAnswer("v1", "빌리다")]));

    const created = transactionClient.userQuizAttempt.createMany.mock.calls[0][0].data;
    expect(created).toHaveLength(4); // 읽기 4건(q-bogus 제외)뿐
    expect(created.map((a: { questionId: string }) => a.questionId)).not.toContain("v1");
  });

  it("채점은 클라이언트 주장이 아니라 Vocabulary.meaning 재조회로 한다", async () => {
    // 클라이언트가 "빌리다" 를 골랐다고 보내도, v2 의 실제 뜻은 "얼다" 라 오답이다.
    const response = await POST(createMixedRequest([listeningAnswer("v2", "빌리다")]));
    const body = await response.json();

    expect(body.summary.listeningCount).toBe(1);
    expect(body.summary.listeningCorrect).toBe(0);
  });

  it("summary 의 total·correct·accuracy 가 읽기+듣기 합계다", async () => {
    // 읽기: 4문항 채점, 2정답. 듣기: 2문항, 1정답 → 6문항 중 3정답 = 50%
    const response = await POST(
      createMixedRequest([listeningAnswer("v1", "빌리다"), listeningAnswer("v2", "빌리다")])
    );
    const body = await response.json();

    expect(body.results).toHaveLength(4); // results 는 읽기 행만 담는다
    expect(body.summary.total).toBe(6); // 그런데 total 은 6이다 — 의도된 차이
    expect(body.summary.correct).toBe(3);
    expect(body.summary.accuracy).toBe(50);
  });

  it("읽기 전승·리스닝 전패면 게이미피케이션이 100%가 아닌 값을 받는다", async () => {
    // 이 단언이 없으면 perfect_day·accuracy_80 배지와 퍼펙트 보너스가 리스닝 오답을 못 본다.
    // 셋 다 회수 경로가 없다(배지는 재평가되지 않고 리그 티어는 단방향이다).
    const allCorrectReading = [
      { questionId: "q1", selectedAnswer: correctTextOf("q1"), hintLevel: 0, timeSpent: 5 },
      { questionId: "q2", selectedAnswer: correctTextOf("q2"), hintLevel: 0, timeSpent: 5 },
    ];

    await POST(createMixedRequest([listeningAnswer("v1", "틀린 뜻")], allCorrectReading));

    expect(processGamificationRewardsMock).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ correctCount: 2, totalCount: 3, accuracy: (2 / 3) * 100 })
    );
  });

  it("편입은 읽기·듣기 단어를 한 번의 호출로 받는다", async () => {
    await POST(createMixedRequest([listeningAnswer("v1", "빌리다")]));

    expect(enrollWordsToSrsMock).toHaveBeenCalledOnce();
    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, [
      ...ENROLL_OUTCOMES,
      { word: "borrow", isCorrect: true, usedHint: false },
    ]);
  });

  it("QuizSession 이 1건 생성되고 유형별 수가 맞다", async () => {
    await POST(
      createMixedRequest([listeningAnswer("v1", "빌리다"), listeningAnswer("v2", "빌리다")])
    );

    expect(transactionClient.quizSession.create).toHaveBeenCalledOnce();
    expect(transactionClient.quizSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        readingCount: 4,
        readingCorrect: 2,
        listeningCount: 2,
        listeningCorrect: 1,
      }),
    });
  });

  it("durationSec 은 두 유형의 timeSpent 합계다", async () => {
    await POST(createMixedRequest([listeningAnswer("v1", "빌리다")]));

    // 읽기 4건 × 5초 + 듣기 1건 × 5초 = 25
    expect(transactionClient.quizSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ durationSec: 25 }),
    });
  });

  it("hintStats 가 리스닝 정답을 포함한다", async () => {
    const response = await POST(createMixedRequest([listeningAnswer("v1", "빌리다", 2)]));
    const body = await response.json();

    // 읽기 정답 2건(무힌트) + 리스닝 정답 1건(힌트 2단계)
    expect(body.summary.hintStats.noHintCorrect).toBe(2);
    expect(body.summary.hintStats.fullHintCorrect).toBe(1);
  });

  it("자동 강등된 리스닝 정답은 프리 힌트를 소비하지 않는다", async () => {
    // 프리 힌트 1장 · 읽기에 1단계 힌트를 쓴 정답 1건 · 강등된 리스닝 정답 1건.
    // 정렬이 hintLevel 내림차순이라, 강등을 거르지 않으면 레벨 2 가 레벨 1 을 앞질러
    // 사용자가 직접 고른 힌트 대신 네트워크 실패에 아이템이 쓰인다.
    transactionClient.userProfile.findUnique.mockResolvedValue({
      freeHintCount: 1,
      xpBoostCharges: 0,
    });
    const hintedReading = [
      { questionId: "q1", selectedAnswer: correctTextOf("q1"), hintLevel: 1, timeSpent: 5 },
    ];

    await POST(createMixedRequest([listeningAnswer("v1", "빌리다", 2, true)], hintedReading));

    // 프리 힌트가 읽기(q1)에 적용됐다면 그 문항의 페널티가 사라져 xpPenaltyFromHints 가 0 이다.
    const upsert = transactionClient.userProfile.upsert.mock.calls[0][0];
    expect(upsert.update.freeHintCount).toEqual({ decrement: 1 });
  });

  it("리스닝만 제출하면 400 이다 — 읽기 0건 세션은 데일리 완료 판정이 죽는다", async () => {
    const response = await POST(createMixedRequest([listeningAnswer("v1", "빌리다")], []));

    expect(response.status).toBe(400);
  });

  it("존재하지 않는 vocabularyId 는 채점 대상에서 조용히 빠지되 분모에도 안 들어간다", async () => {
    const response = await POST(createMixedRequest([listeningAnswer("v-bogus", "빌리다")]));
    const body = await response.json();

    expect(body.summary.listeningCount).toBe(0);
    expect(body.summary.total).toBe(4); // 읽기 4건만
  });

  it("timeSpent 가 비정상적으로 크면 상한으로 잘린다 — durationSec Int 오버플로 방지", async () => {
    const huge = { type: "listening" as const, vocabularyId: "v1", selectedMeaning: "빌리다", timeSpent: 1e12, hintLevel: 0 as const };

    await POST(createMixedRequest([huge]));

    const data = transactionClient.quizSession.create.mock.calls[0][0].data;
    expect(data.durationSec).toBeLessThan(2_147_483_647);
  });
});

/**
 * 타이핑 합류 — 채점 엄격도·SRS 4단계·결과 행의 회귀.
 */
describe("POST /api/quiz/submit — 타이핑 합류", () => {
  beforeEach(() => {
    db.vocabulary.findMany.mockResolvedValue(TYPING_VOCABULARIES);
  });

  it("채점은 서버 재조회로 하고 오타를 오답 처리한다", async () => {
    const response = await POST(createMixedRequest([typingAnswer("v1", "borow")]));
    const body = await response.json();

    expect(body.summary.typingCount).toBe(1);
    expect(body.summary.typingCorrect).toBe(0);
  });

  it("대소문자·공백은 흡수한다", async () => {
    const response = await POST(createMixedRequest([typingAnswer("v1", "  Borrow ")]));
    const body = await response.json();

    expect(body.summary.typingCorrect).toBe(1);
  });

  it("타이핑 답안은 UserQuizAttempt 에 들어가지 않는다", async () => {
    await POST(createMixedRequest([typingAnswer("v1", "borrow")]));

    const created = transactionClient.userQuizAttempt.createMany.mock.calls[0][0].data;
    expect(created.map((a: { questionId: string }) => a.questionId)).not.toContain("v1");
  });

  it("결과 행에 정답 철자와 예문이 실린다 — 틀린 철자를 배우는 유일한 지점", async () => {
    const body = await (
      await POST(createMixedRequest([typingAnswer("v1", "borow")]))
    ).json();

    const row = body.results.find((r: { questionId: string }) => r.questionId === "v1");
    expect(row).toMatchObject({
      isCorrect: false,
      correctAnswer: "borrow",
      explanation: "I will borrow it.",
      sentenceAudioUrl: "https://cdn.test/v1-ex.mp3",
    });
  });

  it("오디오 없이 무힌트 정답은 produced 로 편입된다 — SRS easy 의 유일한 자동 검증", async () => {
    await POST(createMixedRequest([typingAnswer("v1", "borrow", false, 0)]));

    expect(enrollWordsToSrsMock).toHaveBeenCalledWith(USER_ID, [
      ...ENROLL_OUTCOMES,
      { word: "borrow", isCorrect: true, usedHint: false, produced: true },
    ]);
  });

  it("오디오를 들었으면 produced 가 false 다 — 인출 단계가 빠졌다", async () => {
    await POST(createMixedRequest([typingAnswer("v1", "borrow", true, 0)]));

    const outcomes = enrollWordsToSrsMock.mock.calls[0][1];
    expect(outcomes.at(-1)).toMatchObject({ word: "borrow", produced: false });
  });

  it("힌트를 썼으면 produced 가 false 다", async () => {
    await POST(createMixedRequest([typingAnswer("v1", "borrow", false, 2)]));

    const outcomes = enrollWordsToSrsMock.mock.calls[0][1];
    expect(outcomes.at(-1)).toMatchObject({ usedHint: true, produced: false });
  });

  it("summary 가 세 유형 합계다", async () => {
    // 읽기 4문항 중 2정답 + 듣기 1(정답) + 쓰기 1(정답) = 6문항 중 4정답
    const body = await (
      await POST(
        createMixedRequest([listeningAnswer("v2", "얼다"), typingAnswer("v1", "borrow")])
      )
    ).json();

    expect(body.summary.total).toBe(6);
    expect(body.summary.correct).toBe(4);
    expect(body.summary.typingCount).toBe(1);
  });

  it("QuizSession 에 유형별 수가 기록된다", async () => {
    await POST(
      createMixedRequest([listeningAnswer("v2", "얼다"), typingAnswer("v1", "borrow")])
    );

    expect(transactionClient.quizSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        readingCount: 4,
        readingCorrect: 2,
        listeningCount: 1,
        listeningCorrect: 1,
        typingCount: 1,
        typingCorrect: 1,
      }),
    });
  });

  it("존재하지 않는 vocabularyId 는 분모에 안 들어간다", async () => {
    const body = await (
      await POST(createMixedRequest([typingAnswer("v-bogus", "borrow")]))
    ).json();

    expect(body.summary.typingCount).toBe(0);
    expect(body.summary.total).toBe(4);
  });

  it("게이미피케이션이 타이핑을 포함한 합계를 받는다", async () => {
    const allCorrectReading = [
      { questionId: "q1", selectedAnswer: correctTextOf("q1"), hintLevel: 0, timeSpent: 5 },
    ];

    await POST(createMixedRequest([typingAnswer("v1", "borow")], allCorrectReading));

    // 읽기 1정답 + 쓰기 1오답 = 2문항 중 1정답 = 50%. 읽기만 세면 100% 가 되어
    // perfect_day 배지와 퍼펙트 보너스가 잘못 열린다(회수 경로 없음).
    expect(processGamificationRewardsMock).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ correctCount: 1, totalCount: 2, accuracy: 50 })
    );
  });
});
