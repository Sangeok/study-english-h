/**
 * quiz-session-storage — 진행 중 세션 스냅샷의 저장소 계약.
 *
 * 이 모듈이 지켜야 하는 것은 두 가지다:
 *   1. 같은 날의 세션만 되살린다 (날짜·버전·구조가 하나라도 어긋나면 폐기)
 *   2. **되살린 세션은 항상 정합하다** — 답안 키가 문항 집합을 벗어나지 않는다.
 *      이 불변식이 깨진 상태가 정확히 우리가 고치려는 stuck(제출 불가)이므로,
 *      zod 통과만으로는 부족하다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  QUIZ_SESSION_STORAGE_KEY,
  readQuizSession,
  saveQuizSession,
  clearQuizSession,
  toDailyQuizResponse,
  type QuizSessionSnapshotInput,
} from "./quiz-session-storage";

const SAVED_AT = new Date("2026-08-11T10:00:00+09:00");
const SAME_DAY = new Date("2026-08-11T23:59:00+09:00");
const NEXT_DAY = new Date("2026-08-12T00:01:00+09:00");

const INPUT: QuizSessionSnapshotInput = {
  listeningEnabled: true,
  userLevel: "A2",
  hasCompletedToday: false,
  freeHintCount: 2,
  questions: [
    {
      type: "reading",
      id: "q1",
      koreanHint: "빌리다",
      contextHint: "도서관에서",
      sentence: "I want to ___ a book.",
      difficulty: "A1",
      category: "daily",
      options: [{ text: "borrow" }, { text: "freeze" }],
    },
    {
      type: "listening",
      id: "v1",
      audioUrl: "https://cdn.test/v1.mp3",
      options: [{ text: "빌리다" }, { text: "얼다" }],
    },
    {
      type: "typing",
      id: "t1",
      meaning: "빌리다",
      audioUrl: "https://cdn.test/t1.mp3",
      blankedSentence: "I need to ___ a book.",
    },
  ],
  answers: {
    q1: {
      type: "reading",
      questionId: "q1",
      selectedAnswer: "borrow",
      timeSpent: 4,
      hintLevel: 0,
    },
  },
  hintLevels: { q1: 0 },
  degradedIds: [],
  audioPlayedIds: [],
  currentIndex: 1,
};

beforeEach(() => {
  // 복구를 afterEach 가 아니라 beforeEach 에 둔다 — happy-dom 의 localStorage 는
  //   프록시라 스파이 해제가 케이스 경계를 넘어 새는 것을 여기서 확실히 끊는다.
  vi.restoreAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("저장 → 복원 왕복", () => {
  it("같은 날이면 저장한 세션을 그대로 돌려준다", () => {
    saveQuizSession(INPUT, SAVED_AT);

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.questions).toHaveLength(3);
    expect(result.session.answers.q1).toEqual(INPUT.answers.q1);
    expect(result.session.currentIndex).toBe(1);
    expect(result.session.listeningEnabled).toBe(true);
    expect(result.session.freeHintCount).toBe(2);
  });

  it("저장된 적이 없으면 empty 다", () => {
    expect(readQuizSession(SAME_DAY)).toEqual({ status: "empty" });
  });

  it("clearQuizSession 이후에는 empty 다", () => {
    saveQuizSession(INPUT, SAVED_AT);

    clearQuizSession();

    expect(readQuizSession(SAME_DAY)).toEqual({ status: "empty" });
  });
});

describe("폐기 규칙", () => {
  it("KST 날짜가 지나면 expired 이고 키를 지운다", () => {
    saveQuizSession(INPUT, SAVED_AT);

    expect(readQuizSession(NEXT_DAY)).toEqual({ status: "expired" });
    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("스키마 버전이 다르면 invalid 이고 키를 지운다", () => {
    saveQuizSession(INPUT, SAVED_AT);
    const stored = JSON.parse(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY) as string);
    localStorage.setItem(
      QUIZ_SESSION_STORAGE_KEY,
      JSON.stringify({ ...stored, schemaVersion: 99 })
    );

    expect(readQuizSession(SAME_DAY)).toEqual({ status: "invalid" });
    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("JSON 이 깨져 있으면 invalid 이고 키를 지운다", () => {
    localStorage.setItem(QUIZ_SESSION_STORAGE_KEY, "{ not valid json");

    expect(readQuizSession(SAME_DAY)).toEqual({ status: "invalid" });
    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("문항이 하나도 없으면 invalid 다 — 되살릴 퀴즈가 아니다", () => {
    saveQuizSession({ ...INPUT, questions: [], answers: {}, hintLevels: {} }, SAVED_AT);

    expect(readQuizSession(SAME_DAY)).toEqual({ status: "invalid" });
  });
});

describe("정합성 강제", () => {
  it("문항에 없는 답안 키를 ready 에서 제거한다 — stuck 의 구조적 차단", () => {
    saveQuizSession(
      {
        ...INPUT,
        answers: {
          ...INPUT.answers,
          ghost: {
            type: "reading",
            questionId: "ghost",
            selectedAnswer: "stale",
            timeSpent: 1,
            hintLevel: 0,
          },
        },
      },
      SAVED_AT
    );

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(Object.keys(result.session.answers)).toEqual(["q1"]);
  });

  it("문항에 없는 힌트·ref 키도 함께 제거한다", () => {
    saveQuizSession(
      {
        ...INPUT,
        hintLevels: { q1: 1, ghost: 2 },
        degradedIds: ["v1", "ghost"],
        audioPlayedIds: ["t1", "ghost"],
      },
      SAVED_AT
    );

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(Object.keys(result.session.hintLevels)).toEqual(["q1"]);
    expect(result.session.degradedIds).toEqual(["v1"]);
    expect(result.session.audioPlayedIds).toEqual(["t1"]);
  });

  it("문항 수를 넘는 인덱스를 마지막 문항으로 맞춘다", () => {
    saveQuizSession({ ...INPUT, currentIndex: 99 }, SAVED_AT);

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.currentIndex).toBe(2);
  });
});

describe("답안 계약", () => {
  it("type 없는 읽기 답안도 파싱한다 — ReadingSubmission 과 같은 optional 계약", () => {
    saveQuizSession(INPUT, SAVED_AT);
    const stored = JSON.parse(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY) as string);
    delete stored.answers.q1.type;
    localStorage.setItem(QUIZ_SESSION_STORAGE_KEY, JSON.stringify(stored));

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.answers.q1).toMatchObject({ selectedAnswer: "borrow" });
  });

  it("리스닝·타이핑 답안이 각자의 arm 으로 복원된다", () => {
    saveQuizSession(
      {
        ...INPUT,
        answers: {
          v1: {
            type: "listening",
            vocabularyId: "v1",
            selectedMeaning: "빌리다",
            timeSpent: 3,
            hintLevel: 2,
            autoDegraded: true,
          },
          t1: {
            type: "typing",
            vocabularyId: "t1",
            typedAnswer: "borow",
            audioPlayed: true,
            timeSpent: 9,
            hintLevel: 1,
          },
        },
      },
      SAVED_AT
    );

    const result = readQuizSession(SAME_DAY);

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.answers.v1).toMatchObject({ autoDegraded: true });
    expect(result.session.answers.t1).toMatchObject({ typedAnswer: "borow", audioPlayed: true });
  });
});

describe("저장소를 쓸 수 없는 환경", () => {
  /**
   * `mockImplementationOnce` 인 것이 중요하다.
   *
   * happy-dom 의 localStorage 는 Proxy 라 `vi.restoreAllMocks()` 가 스파이를 되돌리지 못한다 —
   * `mockImplementation` 으로 던지게 만들면 그 구현이 이후 케이스까지 살아남아 저장이 통째로
   * 죽는다(실제로 뒤 케이스가 그렇게 깨졌다). once 는 첫 호출만 가로채고 그다음부터
   * 원본으로 돌아가므로 유출 자체가 생기지 않는다.
   */
  it("쓰기가 던지면 unavailable 을 반환하고 삼킨다", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded");
    });

    expect(saveQuizSession(INPUT, SAVED_AT)).toEqual({ status: "unavailable" });
  });

  it("읽기가 던지면 unavailable 을 반환한다", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementationOnce(() => {
      throw new Error("blocked");
    });

    expect(readQuizSession(SAME_DAY)).toEqual({ status: "unavailable" });
  });
});

describe("toDailyQuizResponse", () => {
  it("스냅샷에서 daily 응답 모양을 만든다 — totalQuestions 는 문항 수에서 파생된다", () => {
    saveQuizSession(INPUT, SAVED_AT);
    const result = readQuizSession(SAME_DAY);
    if (result.status !== "ready") throw new Error("expected ready");

    const response = toDailyQuizResponse(result.session);

    expect(response.totalQuestions).toBe(3);
    expect(response.questions).toHaveLength(3);
    expect(response.userLevel).toBe("A2");
    expect(response.hasCompletedToday).toBe(false);
    expect(response.freeHintCount).toBe(2);
  });
});
