// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import prisma from "@/lib/db";
import { getStreakUpdateData } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import { POST } from "./route";

const USER_ID = "user-1";
const NOW = new Date("2026-07-13T12:00:00.000Z");
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const ANSWERS = Array.from({ length: 20 }, (_, index) => ({
  questionId: `question-${index + 1}`,
  selectedText: "correct",
}));

const QUESTIONS = ANSWERS.map((answer, index) => ({
  id: answer.questionId,
  koreanHint: `hint-${index + 1}`,
  contextHintKo: null,
  englishWord: `word-${index + 1}`,
  sentence: `Sentence ${index + 1}`,
  sentenceAudioUrl: null,
  difficulty: "A1",
  category: "daily",
  createdAt: NOW,
  options: [
    {
      id: `option-${index + 1}`,
      questionId: answer.questionId,
      text: "correct",
      isCorrect: true,
      order: 1,
    },
  ],
}));

const STREAK_DATA = {
  lastStudyDate: NOW,
  currentStreak: 1,
  longestStreak: 1,
  freezeUsed: false,
  newFreezeCount: 0,
};

const CREATED_DIAGNOSIS = {
  id: "diagnosis-new",
  userId: USER_ID,
  totalScore: 100,
  cefrLevel: "C2",
  completedAt: NOW,
  weaknessAreas: [],
};

const GAMIFICATION_RESULT = {
  leaguePoints: 30,
  promoted: false,
  newTierName: null,
  milestones: [],
  newAchievements: [],
};

type LatestDiagnosis = {
  id: string;
  completedAt: Date;
};

type TransactionClientMock = {
  $queryRaw: ReturnType<typeof vi.fn>;
  levelDiagnosis: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  userProfile: {
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

let latestDiagnosis: LatestDiagnosis | null;
let transactionCallOrder: string[];
let transactionClient: TransactionClientMock;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

function createSubmitRequest(): Request {
  return new Request("http://localhost/api/diagnosis/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: ANSWERS }),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();

  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  latestDiagnosis = null;
  transactionCallOrder = [];

  transactionClient = {
    $queryRaw: vi.fn().mockImplementation(async () => {
      transactionCallOrder.push("lock");
      return [{ lockResult: "" }];
    }),
    levelDiagnosis: {
      findFirst: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("find-latest");
        return latestDiagnosis;
      }),
      create: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("create");
        return CREATED_DIAGNOSIS;
      }),
    },
    userProfile: {
      upsert: vi.fn().mockImplementation(async () => {
        transactionCallOrder.push("upsert");
        return { id: "profile-1", userId: USER_ID };
      }),
    },
  };

  db.quizQuestion.findMany.mockResolvedValue(QUESTIONS);
  db.$transaction.mockImplementation(
    async (
      callback: (client: TransactionClientMock) => Promise<unknown>
    ) => callback(transactionClient)
  );
  getSessionMock.mockResolvedValue({
    user: { id: USER_ID },
  } as Awaited<ReturnType<typeof getSessionFromRequest>>);
  getStreakUpdateDataMock.mockResolvedValue(STREAK_DATA);
  processGamificationRewardsMock.mockResolvedValue(GAMIFICATION_RESULT);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.useRealTimers();
});

describe("POST /api/diagnosis/submit", () => {
  it("잠금과 최근 진단 확인 뒤 진단·프로필을 저장하고 게이미피케이션을 실행한다", async () => {
    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      diagnosisId: CREATED_DIAGNOSIS.id,
      totalScore: 100,
      cefrLevel: "C2",
      gamification: GAMIFICATION_RESULT,
    });
    expect(transactionCallOrder).toEqual([
      "lock",
      "find-latest",
      "create",
      "upsert",
    ]);
    expect(transactionClient.$queryRaw.mock.calls[0][1]).toBe(
      `diagnosis-submit:${USER_ID}`
    );
    expect(
      transactionClient.$queryRaw.mock.calls[0][0].join("?")
    ).toContain("pg_advisory_xact_lock");
    expect(transactionClient.levelDiagnosis.create).toHaveBeenCalledOnce();
    expect(transactionClient.userProfile.upsert).toHaveBeenCalledOnce();
    expect(getStreakUpdateDataMock).toHaveBeenCalledWith(
      USER_ID,
      NOW,
      transactionClient
    );
    expect(processGamificationRewardsMock).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        type: "diagnosis",
        totalCount: ANSWERS.length,
        accuracy: 100,
        currentStreak: STREAK_DATA.currentStreak,
      })
    );
  });

  it("30일 이내 최근 진단이 있으면 409를 반환하고 쓰기와 보상을 실행하지 않는다", async () => {
    const completedAt = new Date(NOW.getTime() - MILLISECONDS_PER_DAY);
    latestDiagnosis = { id: "diagnosis-existing", completedAt };

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "DIAGNOSIS_ALREADY_COMPLETED",
      diagnosisId: latestDiagnosis.id,
      completedAt: completedAt.toISOString(),
      daysUntilRetake: 29,
    });
    expect(transactionCallOrder).toEqual(["lock", "find-latest"]);
    expect(transactionClient.levelDiagnosis.create).not.toHaveBeenCalled();
    expect(transactionClient.userProfile.upsert).not.toHaveBeenCalled();
    expect(getStreakUpdateDataMock).not.toHaveBeenCalled();
    expect(processGamificationRewardsMock).not.toHaveBeenCalled();
  });

  it("최근 진단이 정확히 30일 지났으면 새 진단과 프로필 저장을 허용한다", async () => {
    latestDiagnosis = {
      id: "diagnosis-old",
      completedAt: new Date(
        NOW.getTime() - 30 * MILLISECONDS_PER_DAY
      ),
    };

    const response = await POST(createSubmitRequest());

    expect(response.status).toBe(200);
    expect(transactionCallOrder).toEqual([
      "lock",
      "find-latest",
      "create",
      "upsert",
    ]);
    expect(transactionClient.levelDiagnosis.create).toHaveBeenCalledOnce();
    expect(transactionClient.userProfile.upsert).toHaveBeenCalledOnce();
    expect(processGamificationRewardsMock).toHaveBeenCalledOnce();
  });

  it("게이미피케이션이 실패해도 저장된 진단을 200과 null 보상으로 반환한다", async () => {
    const gamificationError = new Error("gamification failed");
    processGamificationRewardsMock.mockRejectedValueOnce(gamificationError);

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      diagnosisId: CREATED_DIAGNOSIS.id,
      gamification: null,
    });
    expect(transactionClient.levelDiagnosis.create).toHaveBeenCalledOnce();
    expect(transactionClient.userProfile.upsert).toHaveBeenCalledOnce();
    expect(processGamificationRewardsMock).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Diagnosis gamification error:",
      {
        userId: USER_ID,
        diagnosisId: CREATED_DIAGNOSIS.id,
        error: gamificationError,
      }
    );
  });

  it("핵심 트랜잭션이 실패하면 500을 반환하고 게이미피케이션을 실행하지 않는다", async () => {
    const transactionError = new Error("transaction failed");
    db.$transaction.mockRejectedValueOnce(transactionError);

    const response = await POST(createSubmitRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "진단 제출 중 오류가 발생했습니다" });
    expect(transactionClient.levelDiagnosis.create).not.toHaveBeenCalled();
    expect(transactionClient.userProfile.upsert).not.toHaveBeenCalled();
    expect(processGamificationRewardsMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Diagnosis submit error:",
      transactionError
    );
  });
});
