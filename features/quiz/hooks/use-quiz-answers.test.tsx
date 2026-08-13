/**
 * use-quiz-answers — 리스닝 대응의 훅 레벨 회귀.
 *
 * 순수 함수 테스트(listening-hint-logic.test.ts)만으로는 이 결함을 못 잡는다:
 * listening-hint-logic 이 옳아도 훅이 getMaxHintLevel(contextHint) 를 계속 부르면
 * contextHint 없는 리스닝 문항은 1단계에서 막히고, 철자 힌트·XP ×0.6 경로·힌트 엔드포인트
 * 호출이 전부 죽는다. 그게 이 계획이 실제로 밟을 뻔한 경로다.
 *
 * @testing-library/react 는 설치돼 있지 않으므로 renderHook 을 쓸 수 없다 —
 * use-diagnosis-quiz.test.tsx 의 useImperativeHandle 하네스 패턴을 따른다.
 */
import { createRef, useImperativeHandle, type RefObject } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useQuizAnswers } from "./use-quiz-answers";
import {
  QUIZ_SESSION_STORAGE_KEY,
  readQuizSession,
  saveQuizSession,
  type QuizSessionSnapshot,
  type QuizSessionSnapshotInput,
} from "../lib/quiz-session-storage";
import type { DailyQuizItem } from "../types";

type HookResult = ReturnType<typeof useQuizAnswers>;

const READING: DailyQuizItem = {
  type: "reading",
  id: "q1",
  koreanHint: "빌리다",
  sentence: "I want to ___ a book.",
  difficulty: "A1",
  category: "daily",
  contextHint: "도서관에서",
  options: [{ text: "borrow" }, { text: "freeze" }],
};

/** contextHint 가 없다 — 읽기 사다리를 그대로 쓰면 여기서 1단계에 갇힌다. */
const LISTENING: DailyQuizItem = {
  type: "listening",
  id: "v1",
  audioUrl: "https://cdn.test/v1.mp3",
  options: [{ text: "빌리다" }, { text: "얼다" }],
};

/** contextHint 가 없는 읽기 문항 — 읽기 사다리는 1단계에서 접히는 게 정상이다. */
const READING_NO_CONTEXT: DailyQuizItem = { ...READING, id: "q2", contextHint: null };

/** 예문이 있는 타이핑 문항 — 사다리가 2단계다. */
const TYPING: DailyQuizItem = {
  type: "typing",
  id: "t1",
  meaning: "빌리다",
  audioUrl: "https://cdn.test/t1.mp3",
  blankedSentence: "I need to ___ a book.",
};

/** 예문이 없는 타이핑 문항 — 사다리가 1단계로 접힌다. */
const TYPING_NO_SENTENCE: DailyQuizItem = { ...TYPING, id: "t2", blankedSentence: undefined };

let container: HTMLDivElement;
let root: Root;
let hookRef: RefObject<HookResult | null>;

interface HarnessProps {
  questions: DailyQuizItem[];
  currentIndex: number;
  isQuizSubmitted?: boolean;
  restored?: QuizSessionSnapshot | null;
}

function Harness({
  questions,
  currentIndex,
  isQuizSubmitted = false,
  restored = null,
}: HarnessProps): null {
  const result = useQuizAnswers({
    questions,
    currentIndex,
    isQuizSubmitted,
    restored,
    listeningEnabled: true,
    userLevel: "A1",
    hasCompletedToday: false,
    freeHintCount: 0,
  });
  useImperativeHandle(hookRef, () => result, [result]);
  return null;
}

async function render(
  questions: DailyQuizItem[],
  currentIndex = 0,
  extra: Omit<HarnessProps, "questions" | "currentIndex"> = {}
): Promise<void> {
  await act(async () => {
    root.render(<Harness questions={questions} currentIndex={currentIndex} {...extra} />);
  });
}

/** 저장소를 거쳐 만든 복원본 — 테스트가 스냅샷 내부 필드(schemaVersion 등)를 흉내내지 않는다. */
function restoredFrom(input: Partial<QuizSessionSnapshotInput> & { questions: DailyQuizItem[] }) {
  saveQuizSession({
    listeningEnabled: true,
    userLevel: "A1",
    hasCompletedToday: false,
    freeHintCount: 0,
    answers: {},
    hintLevels: {},
    degradedIds: [],
    audioPlayedIds: [],
    currentIndex: 0,
    ...input,
  });
  const result = readQuizSession();
  if (result.status !== "ready") throw new Error(`expected ready, got ${result.status}`);
  return result.session;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();

  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  hookRef = createRef<HookResult | null>();
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("힌트 사다리 — 유형 분기", () => {
  it("contextHint 없는 리스닝 문항이 hintLevel 2 에 도달한다", async () => {
    await render([LISTENING]);

    await act(async () => hookRef.current?.handleHintRequest());
    expect(hookRef.current?.hintLevels["v1"]).toBe(1);

    await act(async () => hookRef.current?.handleHintRequest());
    expect(hookRef.current?.hintLevels["v1"]).toBe(2);
  });

  it("contextHint 없는 **읽기** 문항은 여전히 1단계에서 멈춘다 — 읽기 동작 보존", async () => {
    await render([READING_NO_CONTEXT]);

    await act(async () => hookRef.current?.handleHintRequest());
    await act(async () => hookRef.current?.handleHintRequest());

    expect(hookRef.current?.hintLevels["q2"]).toBe(1);
  });

  it("handleHintRequest(2) 한 번으로 레벨 2에 도달한다 — 재생 실패 자동 강등의 기전", async () => {
    await render([LISTENING]);

    await act(async () => hookRef.current?.handleHintRequest(2));

    expect(hookRef.current?.hintLevels["v1"]).toBe(2);
  });

  it("무인자 호출은 여전히 한 단계만 올린다", async () => {
    await render([READING]);

    await act(async () => hookRef.current?.handleHintRequest());

    expect(hookRef.current?.hintLevels["q1"]).toBe(1);
  });
});

describe("handleAnswer — 유형별 제출 shape", () => {
  it("읽기는 questionId·selectedAnswer 를 만든다", async () => {
    await render([READING]);

    await act(async () => hookRef.current?.handleAnswer("q1", "borrow"));

    expect(hookRef.current?.answers["q1"]).toMatchObject({
      type: "reading",
      questionId: "q1",
      selectedAnswer: "borrow",
    });
  });

  it("리스닝은 vocabularyId·selectedMeaning 으로 리맵된다 — 키는 question.id 그대로", async () => {
    await render([LISTENING]);

    await act(async () => hookRef.current?.handleAnswer("v1", "빌리다"));

    // 맵의 키는 question.id 다(답안·힌트·타이머가 이 키를 공유한다).
    expect(Object.keys(hookRef.current?.answers ?? {})).toEqual(["v1"]);
    expect(hookRef.current?.answers["v1"]).toMatchObject({
      type: "listening",
      vocabularyId: "v1",
      selectedMeaning: "빌리다",
    });
  });

  it("자동 강등된 문항은 autoDegraded 를 실어 보낸다 — 프리 힌트 제외의 근거", async () => {
    await render([LISTENING]);

    await act(async () => hookRef.current?.handleHintRequest(2));
    await act(async () => hookRef.current?.handleAnswer("v1", "빌리다"));

    expect(hookRef.current?.answers["v1"]).toMatchObject({ autoDegraded: true });
  });

  it("사용자가 직접 연 힌트에는 autoDegraded 가 붙지 않는다", async () => {
    await render([LISTENING]);

    await act(async () => hookRef.current?.handleHintRequest());
    await act(async () => hookRef.current?.handleHintRequest());
    await act(async () => hookRef.current?.handleAnswer("v1", "빌리다"));

    expect(hookRef.current?.answers["v1"]).not.toHaveProperty("autoDegraded");
    expect(hookRef.current?.answers["v1"]?.hintLevel).toBe(2);
  });
});

describe("타이핑 — 힌트 사다리 접힘", () => {
  it("예문이 있으면 2단계까지 오른다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.handleHintRequest());
    expect(hookRef.current?.hintLevels["t1"]).toBe(1);

    await act(async () => hookRef.current?.handleHintRequest());
    expect(hookRef.current?.hintLevels["t1"]).toBe(2);
  });

  it("예문이 없으면 1단계에서 멈춘다 — 더 줄 게 없다", async () => {
    await render([TYPING_NO_SENTENCE]);

    await act(async () => hookRef.current?.handleHintRequest());
    await act(async () => hookRef.current?.handleHintRequest());

    expect(hookRef.current?.hintLevels["t2"]).toBe(1);
  });
});

describe("타이핑 — 제출 shape", () => {
  it("친 문자열을 정규화 없이 그대로 보낸다 — 채점 규칙은 서버 한 곳에만 둔다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.handleAnswer("t1", "  BorRow "));

    expect(hookRef.current?.answers["t1"]).toMatchObject({
      type: "typing",
      vocabularyId: "t1",
      typedAnswer: "  BorRow ",
    });
  });

  it("맵의 키는 question.id 다 — 답안·힌트·타이머가 이 키를 공유한다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));

    expect(Object.keys(hookRef.current?.answers ?? {})).toEqual(["t1"]);
  });

  it("발음을 안 들었으면 audioPlayed 가 false 다 — SRS easy 의 조건", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));

    expect(hookRef.current?.answers["t1"]).toMatchObject({ audioPlayed: false });
  });

  it("발음을 들었으면 audioPlayed 가 true 다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.markAudioPlayed("t1"));
    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));

    expect(hookRef.current?.answers["t1"]).toMatchObject({ audioPlayed: true });
  });

  it("다른 문항의 재생 표시가 섞이지 않는다", async () => {
    await render([TYPING, TYPING_NO_SENTENCE]);

    await act(async () => hookRef.current?.markAudioPlayed("t1"));
    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));
    await act(async () => hookRef.current?.handleAnswer("t2", "freeze"));

    expect(hookRef.current?.answers["t1"]).toMatchObject({ audioPlayed: true });
    expect(hookRef.current?.answers["t2"]).toMatchObject({ audioPlayed: false });
  });

  it("입력을 고쳐 치면 마지막 값이 남는다 — 매 키 입력마다 저장된다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.handleAnswer("t1", "bor"));
    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));

    expect(hookRef.current?.answers["t1"]).toMatchObject({ typedAnswer: "borrow" });
  });
});

describe("복원 — 스냅샷이 초기 상태가 된다", () => {
  it("답안과 힌트 레벨을 시드로 받는다", async () => {
    const restored = restoredFrom({
      questions: [READING],
      answers: {
        q1: {
          type: "reading",
          questionId: "q1",
          selectedAnswer: "borrow",
          timeSpent: 5,
          hintLevel: 1,
        },
      },
      hintLevels: { q1: 1 },
    });

    await render([READING], 0, { restored });

    expect(hookRef.current?.answers["q1"]).toMatchObject({ selectedAnswer: "borrow" });
    expect(hookRef.current?.hintLevels["q1"]).toBe(1);
  });

  it("복원 후 답을 고치면 새 값이 이긴다 — 시드가 다시 덮어쓰지 않는다", async () => {
    const restored = restoredFrom({
      questions: [READING],
      answers: {
        q1: {
          type: "reading",
          questionId: "q1",
          selectedAnswer: "borrow",
          timeSpent: 5,
          hintLevel: 0,
        },
      },
    });

    await render([READING], 0, { restored });
    await act(async () => hookRef.current?.handleAnswer("q1", "freeze"));

    expect(hookRef.current?.answers["q1"]).toMatchObject({ selectedAnswer: "freeze" });
  });

  it("강등 표시를 복원한다 — 되살아난 문항의 autoDegraded 가 살아 있다", async () => {
    const restored = restoredFrom({ questions: [LISTENING], degradedIds: ["v1"] });

    await render([LISTENING], 0, { restored });
    await act(async () => hookRef.current?.handleAnswer("v1", "빌리다"));

    expect(hookRef.current?.answers["v1"]).toMatchObject({ autoDegraded: true });
  });

  it("발음 청취 표시를 복원한다 — SRS 확신도가 과대평가되지 않는다", async () => {
    const restored = restoredFrom({ questions: [TYPING], audioPlayedIds: ["t1"] });

    await render([TYPING], 0, { restored });
    await act(async () => hookRef.current?.handleAnswer("t1", "borrow"));

    expect(hookRef.current?.answers["t1"]).toMatchObject({ audioPlayed: true });
  });
});

describe("저장 — 흔적이 있을 때만", () => {
  it("아무것도 하지 않으면 저장하지 않는다 — 시작만으로 그날 세트가 고정되면 안 된다", async () => {
    await render([READING]);

    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("답을 고르면 문항과 함께 저장한다", async () => {
    await render([READING, LISTENING]);

    await act(async () => hookRef.current?.handleAnswer("q1", "borrow"));

    const result = readQuizSession();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.questions).toHaveLength(2);
    expect(result.session.answers["q1"]).toMatchObject({ selectedAnswer: "borrow" });
  });

  it("힌트만 열어도 저장한다 — 힌트 레벨은 XP 페널티로 이어진다", async () => {
    await render([READING]);

    await act(async () => hookRef.current?.handleHintRequest());

    const result = readQuizSession();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.hintLevels["q1"]).toBe(1);
  });

  it("발음만 들어도 저장한다 — ref 는 리렌더를 일으키지 않으므로 직접 저장해야 한다", async () => {
    await render([TYPING]);

    await act(async () => hookRef.current?.markAudioPlayed("t1"));

    const result = readQuizSession();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.audioPlayedIds).toEqual(["t1"]);
  });

  it("진행 인덱스를 함께 저장한다", async () => {
    await render([READING, LISTENING], 1);

    await act(async () => hookRef.current?.handleAnswer("v1", "빌리다"));

    const result = readQuizSession();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.session.currentIndex).toBe(1);
  });

  it("제출에 성공하면 지운다", async () => {
    await render([READING]);
    await act(async () => hookRef.current?.handleAnswer("q1", "borrow"));
    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).not.toBeNull();

    await render([READING], 0, { isQuizSubmitted: true });

    expect(localStorage.getItem(QUIZ_SESSION_STORAGE_KEY)).toBeNull();
  });
});
