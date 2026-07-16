import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  DiagnosisLoading: () => <div>loading</div>,
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
