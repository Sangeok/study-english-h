// @vitest-environment node
/**
 * 데일리 퀴즈 라우트 — 리스닝 합류의 회귀.
 *
 * 이 파일이 없으면 성공 기준 1(`?listening=0` → 0문항)과 2(응답에 철자 미노출)를
 * 아무도 지키지 않는다. 둘 다 이 라우트의 동작이고 다른 자동 검증이 없다.
 *
 * 목 구성은 app/api/profile/stats/route.test.ts 관례를 따른다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    quizQuestion: { count: vi.fn(), findMany: vi.fn() },
    userQuizAttempt: { count: vi.fn(), findMany: vi.fn() },
    userProfile: { findUnique: vi.fn() },
    userVocabulary: { findMany: vi.fn() },
    vocabulary: { findMany: vi.fn() },
  },
}));

vi.mock("@/shared/lib/get-session", () => ({
  getSession: vi.fn(),
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/diagnosis-guards", () => ({
  checkDiagnosisStatus: vi.fn(),
}));

import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { LISTENING_QUESTION_COUNT } from "@/shared/constants";
import { GET } from "./route";

const USER_ID = "user-1";

const db = prisma as unknown as {
  quizQuestion: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  userQuizAttempt: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  userProfile: { findUnique: ReturnType<typeof vi.fn> };
  userVocabulary: { findMany: ReturnType<typeof vi.fn> };
  vocabulary: { findMany: ReturnType<typeof vi.fn> };
};

function makeQuestion(id: string, englishWord: string) {
  return {
    id,
    koreanHint: `hint-${id}`,
    contextHintKo: null,
    englishWord,
    sentence: `Sentence for ${englishWord}`,
    sentenceAudioUrl: null,
    difficulty: "A1",
    category: "daily",
    createdAt: new Date("2026-07-24T00:00:00.000Z"),
    options: [
      { id: `o-${id}-1`, questionId: id, text: englishWord, isCorrect: true, order: 1 },
      { id: `o-${id}-2`, questionId: id, text: `${englishWord}-x`, isCorrect: false, order: 2 },
    ],
  };
}

/** 읽기 문항 풀 — 충분히 커서 count 만큼 항상 채워진다. */
const QUESTIONS = Array.from({ length: 30 }, (_, i) => makeQuestion(`q${i}`, `word${i}`));

/** 어휘 풀 — 오답 보기 3개를 항상 채울 수 있도록 뜻을 전부 다르게 둔다. */
const VOCABULARIES = Array.from({ length: 30 }, (_, i) => ({
  id: `v${i}`,
  word: `vocab${i}`,
  meaning: `뜻${i}`,
  audioUrl: `https://cdn.test/v${i}.mp3`,
}));

function request(query: string): Request {
  return new Request(`http://localhost/api/quiz/daily${query}`);
}

interface ResponseItem {
  type: "reading" | "listening";
  id: string;
  [key: string]: unknown;
}

async function fetchItems(query: string): Promise<ResponseItem[]> {
  const response = await GET(request(query));
  const body = await response.json();
  return body.questions as ResponseItem[];
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getSessionFromRequest).mockResolvedValue({ user: { id: USER_ID } } as never);
  vi.mocked(checkDiagnosisStatus).mockResolvedValue({ hasCompleted: true } as never);

  db.userProfile.findUnique.mockResolvedValue({ level: "A1", weaknessAreas: null, freeHintCount: 0 });
  db.userQuizAttempt.count.mockResolvedValue(0);
  db.userQuizAttempt.findMany.mockResolvedValue([]);
  db.quizQuestion.count.mockResolvedValue(QUESTIONS.length);
  db.quizQuestion.findMany.mockResolvedValue(QUESTIONS);
  db.userVocabulary.findMany.mockResolvedValue([]); // 도래·편입 이력 없음 → 3단계(무작위)
  db.vocabulary.findMany.mockResolvedValue(VOCABULARIES);
});

describe("listening 파라미터 파싱", () => {
  it("?listening=0 이면 리스닝 0문항, 읽기가 count 개다", async () => {
    // getQuizCount 를 재사용하면 0 이 DEFAULT_QUIZ_COUNT 로 바뀐다 — 이 단언이 그 회귀를 잡는다.
    const items = await fetchItems("?count=10&listening=0");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(0);
    expect(items.filter((i) => i.type === "reading")).toHaveLength(10);
  });

  it("listening 미지정이면 LISTENING_QUESTION_COUNT 개다", async () => {
    const items = await fetchItems("?count=10");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(LISTENING_QUESTION_COUNT);
  });

  it("음수·비정수·NaN 은 기본값으로 떨어진다", async () => {
    for (const raw of ["-1", "1.5", "abc"]) {
      const items = await fetchItems(`?count=10&listening=${raw}`);
      expect(items.filter((i) => i.type === "listening")).toHaveLength(LISTENING_QUESTION_COUNT);
    }
  });

  it("초과 요청은 LISTENING_QUESTION_COUNT 로 클램프된다 — 킬 스위치를 지키는 단언", async () => {
    const items = await fetchItems("?count=10&listening=99");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(LISTENING_QUESTION_COUNT);
  });

  it("?count=3&listening=3 이면 리스닝 2·읽기 1 이다 — count-1 상한", async () => {
    // 읽기가 0이 되면 UserQuizAttempt 행이 없어 그날 데일리 완료 판정이 죽는다.
    const items = await fetchItems("?count=3&listening=3");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(2);
    expect(items.filter((i) => i.type === "reading")).toHaveLength(1);
  });

  it("count=1 이면 리스닝이 0이다 — 읽기 한 문항이 세션을 지탱한다", async () => {
    const items = await fetchItems("?count=1");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(0);
  });
});

describe("응답 형태", () => {
  it("리스닝 문항에 word(철자)가 없다 — 성공 기준 2", async () => {
    // 타입은 컴파일만 강제하고 런타임 스프레드는 못 막으므로 응답 객체를 직접 검사한다.
    const items = await fetchItems("?count=10");
    const listening = items.filter((i) => i.type === "listening");

    expect(listening.length).toBeGreaterThan(0);
    for (const item of listening) {
      expect(Object.keys(item).sort()).toEqual(["audioUrl", "id", "options", "type"]);
    }
  });

  it("리스닝 보기에 정답 표시(isCorrect)가 없다", async () => {
    const items = await fetchItems("?count=10");
    const listening = items.filter((i) => i.type === "listening");

    for (const item of listening) {
      for (const option of item.options as { text: string }[]) {
        expect(Object.keys(option)).toEqual(["text"]);
      }
    }
  });

  it("두 유형 모두 type 판별자를 싣는다 — 선택적이면 어느 case 에도 안 걸린다", async () => {
    const items = await fetchItems("?count=10");

    expect(items.every((i) => i.type === "reading" || i.type === "listening")).toBe(true);
    expect(items.some((i) => i.type === "reading")).toBe(true);
    expect(items.some((i) => i.type === "listening")).toBe(true);
  });

  it("totalQuestions 가 합친 배열의 길이다 — 읽기 변수에서 뽑으면 7 이 된다", async () => {
    const response = await GET(request("?count=10"));
    const body = await response.json();

    expect(body.totalQuestions).toBe(body.questions.length);
    expect(body.totalQuestions).toBe(10);
  });
});

describe("문항 수 배분", () => {
  it("총 문항이 count 다 — 리스닝만큼 읽기가 줄어든다", async () => {
    const items = await fetchItems("?count=10");

    expect(items).toHaveLength(10);
    expect(items.filter((i) => i.type === "reading")).toHaveLength(10 - LISTENING_QUESTION_COUNT);
  });

  it("count=10·리스닝 3 일 때 총 문항이 13 이 아니다", async () => {
    // emergency fallback 발동 조건(questions.length < count)을 readingCount 로 안 바꾸면
    // 읽기 7건을 뽑은 뒤 7 < 10 이 참이라 3건을 더 붙여 13문항이 나간다.
    const items = await fetchItems("?count=10");

    expect(items).toHaveLength(10);
  });

  it("어휘 풀이 비면 리스닝 0 이고 읽기가 count 를 채운다", async () => {
    db.vocabulary.findMany.mockResolvedValue([]);

    const items = await fetchItems("?count=10");

    expect(items.filter((i) => i.type === "listening")).toHaveLength(0);
    expect(items).toHaveLength(10);
  });
});

describe("유형 간 단어 중복", () => {
  it("리스닝 단어와 같은 englishWord 를 가진 읽기 문항이 실리지 않는다", async () => {
    // 읽기 문항 하나가 리스닝 어휘와 같은 단어를 쓰게 만든다.
    db.quizQuestion.findMany.mockResolvedValue([
      makeQuestion("dup", "vocab0"),
      ...QUESTIONS.slice(1),
    ]);

    const items = await fetchItems("?count=10");
    const listeningIds = items.filter((i) => i.type === "listening").map((i) => i.id);

    // vocab0(v0)이 리스닝으로 뽑혔다면 같은 단어의 읽기 문항("dup")은 빠져야 한다.
    if (listeningIds.includes("v0")) {
      expect(items.map((i) => i.id)).not.toContain("dup");
    }
  });
});

describe("인증·진단 가드", () => {
  it("미인증이면 401", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null as never);

    const response = await GET(request("?count=10"));

    expect(response.status).toBe(401);
  });

  it("진단 미완료면 403", async () => {
    vi.mocked(checkDiagnosisStatus).mockResolvedValue({ hasCompleted: false } as never);

    const response = await GET(request("?count=10"));

    expect(response.status).toBe(403);
  });
});
