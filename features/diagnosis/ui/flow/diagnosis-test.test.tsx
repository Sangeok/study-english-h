import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiagnosisQuestion } from "@/entities/question";
import { TRANSITION_DURATION_MS } from "../../config";
import { DiagnosisTest } from "./diagnosis-test";

const mocks = vi.hoisted(() => ({
  clearGuestDiagnosis: vi.fn(),
  readGuestDiagnosis: vi.fn(),
  routerPush: vi.fn(),
  saveGuestDiagnosis: vi.fn(),
  useDiagnosisQuiz: vi.fn(),
}));

vi.mock("next/navigation", () => {
  const router = { push: mocks.routerPush };
  return { useRouter: () => router };
});

vi.mock("../../hooks/use-diagnosis-quiz", () => ({
  useDiagnosisQuiz: mocks.useDiagnosisQuiz,
}));

vi.mock("../../hooks/use-diagnosis-timer", () => ({
  useDiagnosisTimer: () => ({
    minutes: 5,
    seconds: 0,
    timePercentage: 100,
    isTimeWarning: false,
  }),
}));

vi.mock("../../hooks/use-unsaved-diagnosis-warning", () => ({
  useUnsavedDiagnosisWarning: vi.fn(),
}));

vi.mock("../../lib/guest-diagnosis-storage", () => ({
  clearGuestDiagnosis: mocks.clearGuestDiagnosis,
  readGuestDiagnosis: mocks.readGuestDiagnosis,
  saveGuestDiagnosis: mocks.saveGuestDiagnosis,
}));

vi.mock("../status/diagnosis-loading", () => ({
  DiagnosisLoading: ({ description }: { title?: string; description?: string }) => (
    <div>loading{description ? ` · ${description}` : ""}</div>
  ),
}));

vi.mock("../status/diagnosis-error", () => ({
  DiagnosisError: ({
    actionLabel = "다시 시도하기",
    onRetry,
  }: {
    actionLabel?: string;
    onRetry: () => void;
  }) => <button onClick={onRetry}>{actionLabel}</button>,
}));

vi.mock("../result/guest-diagnosis-result", () => ({
  GuestDiagnosisResult: ({
    cacheState,
  }: {
    cacheState:
      | { status: "saving" | "ready" }
      | { status: "error"; onRetryCacheSave: () => void };
  }) => (
    <div data-testid="guest-result">
      <span data-testid="cache-status">{cacheState.status}</span>
      {cacheState.status === "error" && (
        <button onClick={cacheState.onRetryCacheSave}>결과 다시 저장</button>
      )}
    </div>
  ),
}));

const ANSWERS = Array.from({ length: 20 }, (_, index) => ({
  questionId: `question-${index + 1}`,
  selectedText: "answer",
}));

const RESULT = {
  totalScore: 75,
  cefrLevel: "B2",
  weaknessAreas: [{ category: "grammar", accuracy: 55 }],
  recommendedStartPoint: "B2-unit-1",
};

const CACHED_DIAGNOSIS = {
  cacheSchemaVersion: 1 as const,
  answers: ANSWERS,
  result: RESULT,
};

let container: HTMLDivElement;
let root: Root;

function createQuizState(overrides: Record<string, unknown> = {}) {
  return {
    questions: [],
    timeLimit: 300,
    isLoading: true,
    isError: false,
    submit: vi.fn(),
    submittedAnswers: [],
    isSubmitting: false,
    submitResult: null,
    isSubmitSuccess: false,
    refetchQuestions: vi.fn(),
    ...overrides,
  };
}

async function flushEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function findButton(label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`버튼을 찾을 수 없습니다: ${label}`);
  }

  return button;
}

describe("DiagnosisTest guest cache boundary", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.clearGuestDiagnosis.mockReset();
    mocks.readGuestDiagnosis.mockReset();
    mocks.routerPush.mockReset();
    mocks.saveGuestDiagnosis.mockReset();
    mocks.useDiagnosisQuiz.mockReset();
    mocks.clearGuestDiagnosis.mockReturnValue({ status: "success" });
    mocks.saveGuestDiagnosis.mockReturnValue({ status: "success" });
    mocks.useDiagnosisQuiz.mockReturnValue(createQuizState());

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("캐시 확인이 끝나기 전에는 퀴즈 훅을 마운트하지 않는다", () => {
    mocks.readGuestDiagnosis.mockReturnValue({ status: "empty" });

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });

    expect(mocks.useDiagnosisQuiz).not.toHaveBeenCalled();
    expect(container.textContent).toContain("loading");
  });

  it("유효한 캐시 결과를 복원할 때 퀴즈 훅을 마운트하지 않는다", async () => {
    mocks.readGuestDiagnosis.mockReturnValue({
      status: "ready",
      diagnosis: CACHED_DIAGNOSIS,
    });

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });
    await flushEffects();

    expect(container.querySelector('[data-testid="guest-result"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="cache-status"]')?.textContent).toBe(
      "ready"
    );
    expect(mocks.useDiagnosisQuiz).not.toHaveBeenCalled();
  });

  it("캐시가 비어 있을 때만 퀴즈 훅을 마운트한다", async () => {
    mocks.readGuestDiagnosis.mockReturnValue({ status: "empty" });

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });
    await flushEffects();

    expect(mocks.useDiagnosisQuiz).toHaveBeenCalledWith(true);
  });

  it("손상 캐시는 사용자가 명시적으로 삭제한 뒤에만 퀴즈를 시작한다", async () => {
    mocks.readGuestDiagnosis.mockReturnValue({ status: "invalid" });

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });
    await flushEffects();

    expect(mocks.clearGuestDiagnosis).not.toHaveBeenCalled();
    expect(mocks.useDiagnosisQuiz).not.toHaveBeenCalled();

    await act(async () => {
      findButton("저장된 결과 삭제하고 진단 다시 시작").click();
    });

    expect(mocks.clearGuestDiagnosis).toHaveBeenCalledOnce();
    expect(mocks.useDiagnosisQuiz).toHaveBeenCalledWith(true);
  });

  it("저장소 접근 실패의 다시 확인은 캐시 읽기만 재시도한다", async () => {
    mocks.readGuestDiagnosis
      .mockReturnValueOnce({ status: "unavailable" })
      .mockReturnValueOnce({ status: "ready", diagnosis: CACHED_DIAGNOSIS });

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });
    await flushEffects();

    await act(async () => {
      findButton("다시 확인").click();
    });

    expect(mocks.readGuestDiagnosis).toHaveBeenCalledTimes(2);
    expect(mocks.clearGuestDiagnosis).not.toHaveBeenCalled();
    expect(mocks.useDiagnosisQuiz).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="guest-result"]')).not.toBeNull();
  });

  it("preview 성공 뒤 cache 저장 실패는 오류 상태를 보이고 저장만 재시도한다", async () => {
    mocks.readGuestDiagnosis.mockReturnValue({ status: "empty" });
    mocks.saveGuestDiagnosis
      .mockReturnValueOnce({ status: "unavailable" })
      .mockReturnValueOnce({ status: "success" });
    mocks.useDiagnosisQuiz.mockReturnValue(
      createQuizState({
        submittedAnswers: ANSWERS,
        submitResult: RESULT,
        isSubmitSuccess: true,
      })
    );

    act(() => {
      root.render(<DiagnosisTest isAuthenticated={false} />);
    });
    await flushEffects();

    expect(container.querySelector('[data-testid="cache-status"]')?.textContent).toBe(
      "error"
    );

    await act(async () => {
      findButton("결과 다시 저장").click();
    });

    expect(mocks.saveGuestDiagnosis).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[data-testid="cache-status"]')?.textContent).toBe(
      "ready"
    );
  });
});

function makeQuestion(number: number): DiagnosisQuestion {
  return {
    id: `q${number}`,
    sentence: `${number}번 문항 문장`,
    difficulty: "A1",
    category: "daily",
    options: [{ text: `q${number}-a` }, { text: `q${number}-b` }],
  };
}

const QUESTIONS = [1, 2, 3].map(makeQuestion);
// 리페치로 다시 뽑힌 세트 — start 는 매 호출 셔플하므로 일부만 겹친다(q3 → q4).
const REFETCHED_QUESTIONS = [1, 2, 4].map(makeQuestion);

function findButtonBy(match: (button: HTMLButtonElement) => boolean): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(match);

  if (!button) {
    throw new Error("조건에 맞는 버튼을 찾을 수 없습니다");
  }

  return button;
}

function findNextButton(): HTMLButtonElement {
  return findButtonBy((button) => Boolean(button.textContent?.includes("다음")));
}

function findSubmitButton(): HTMLButtonElement {
  return findButtonBy((button) => Boolean(button.textContent?.includes("제출하기")));
}

function progressText(): string {
  return container.textContent?.match(/\d+ \/ \d+ 완료/)?.[0] ?? "";
}

function findJumpDot(questionNumber: number): HTMLButtonElement {
  return findButtonBy((button) =>
    Boolean(button.getAttribute("aria-label")?.startsWith(`${questionNumber}번 문항`))
  );
}

/** 선택지 클릭 → 전환 타이머가 지나야 실제 응답으로 기록된다. */
function selectAnswer(questionNumber: number): void {
  act(() => {
    findButtonBy((button) =>
      Boolean(button.textContent?.includes(`q${questionNumber}-a`))
    ).click();
  });
  act(() => {
    vi.advanceTimersByTime(TRANSITION_DURATION_MS);
  });
}

function clickAndSettle(button: HTMLButtonElement): void {
  act(() => {
    button.click();
  });
  act(() => {
    vi.advanceTimersByTime(TRANSITION_DURATION_MS);
  });
}

describe("DiagnosisTest 순차 진행 가드", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    mocks.useDiagnosisQuiz.mockReset();
    mocks.useDiagnosisQuiz.mockReturnValue(
      createQuizState({ questions: QUESTIONS, isLoading: false })
    );

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root.render(<DiagnosisTest isAuthenticated />);
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("현재 문항에 답하지 않으면 다음으로 넘어가지 않는다", () => {
    const nextButton = findNextButton();

    expect(nextButton.disabled).toBe(true);

    clickAndSettle(nextButton);

    expect(container.textContent).toContain("1번 문항 문장");
    expect(container.textContent).not.toContain("2번 문항 문장");
  });

  it("답을 고르면 다음 문항으로 넘어간다", () => {
    selectAnswer(1);

    const nextButton = findNextButton();
    expect(nextButton.disabled).toBe(false);

    clickAndSettle(nextButton);

    expect(container.textContent).toContain("2번 문항 문장");
  });

  it("진행 바에서도 미응답 문항 뒤로는 건너뛸 수 없다", () => {
    expect(findJumpDot(3).disabled).toBe(true);

    clickAndSettle(findJumpDot(3));

    expect(container.textContent).toContain("1번 문항 문장");
  });

  it("이미 답한 문항으로는 진행 바로 되돌아갈 수 있다", () => {
    selectAnswer(1);
    clickAndSettle(findNextButton());
    expect(container.textContent).toContain("2번 문항 문장");

    expect(findJumpDot(1).disabled).toBe(false);
    clickAndSettle(findJumpDot(1));

    expect(container.textContent).toContain("1번 문항 문장");
  });
});

describe("DiagnosisTest 응답 상태와 문항 세트 정합", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    mocks.useDiagnosisQuiz.mockReset();
    mocks.routerPush.mockReset();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderQuiz(questions: DiagnosisQuestion[]): void {
    mocks.useDiagnosisQuiz.mockReturnValue(
      createQuizState({ questions, isLoading: false })
    );
    act(() => {
      root.render(<DiagnosisTest isAuthenticated />);
    });
  }

  // 이전 세트의 답안 키가 남아 응답 수가 총 문항 수를 넘으면(21/20) 제출이 영구 차단된다.
  it("문항 세트가 교체돼도 응답 수는 내려온 문항 기준으로만 센다", () => {
    renderQuiz(QUESTIONS);

    selectAnswer(1);
    clickAndSettle(findNextButton());
    selectAnswer(2);
    clickAndSettle(findNextButton());
    selectAnswer(3);

    expect(progressText()).toBe("3 / 3 완료");
    expect(findSubmitButton().disabled).toBe(false);

    renderQuiz(REFETCHED_QUESTIONS);

    // q3 응답은 더 이상 세지 않는다 — 새로 내려온 q4 는 미응답.
    expect(progressText()).toBe("2 / 3 완료");
    expect(findSubmitButton().disabled).toBe(true);

    selectAnswer(4);

    expect(progressText()).toBe("3 / 3 완료");
    expect(findSubmitButton().disabled).toBe(false);
  });

  it("제출에 성공하면 퀴즈 화면을 닫고 결과 페이지로 이동한다", () => {
    mocks.useDiagnosisQuiz.mockReturnValue(
      createQuizState({
        questions: QUESTIONS,
        isLoading: false,
        isSubmitSuccess: true,
        submitResult: { diagnosisId: "diagnosis-1", ...RESULT },
      })
    );

    act(() => {
      root.render(<DiagnosisTest isAuthenticated />);
    });

    expect(container.textContent).toContain("결과 페이지로 이동");
    // 선택지·다음 버튼이 남아 있으면 제출 뒤 클릭이 답안에 섞인다.
    expect(container.querySelector("button")).toBeNull();
    expect(mocks.routerPush).toHaveBeenCalledWith(
      "/diagnosis/result?id=diagnosis-1"
    );
  });
});
