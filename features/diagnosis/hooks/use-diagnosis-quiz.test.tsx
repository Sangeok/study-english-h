import { useImperativeHandle, type RefObject } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { useDiagnosisQuiz } from "./use-diagnosis-quiz";
import type { DiagnosisStartResponse, DiagnosisSubmitResponse } from "../api/diagnosis-api";
import type { DiagnosisResult } from "../types";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  fetchDiagnosisQuestions: vi.fn(),
  submitDiagnosis: vi.fn(),
  previewDiagnosis: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("../api/diagnosis-api", () => ({
  fetchDiagnosisQuestions: mocks.fetchDiagnosisQuestions,
  submitDiagnosis: mocks.submitDiagnosis,
  previewDiagnosis: mocks.previewDiagnosis,
}));

const START_RESPONSE: DiagnosisStartResponse = {
  questions: [
    {
      id: "q1",
      koreanWord: "사과",
      difficulty: "A1",
      category: "daily",
      options: [
        { id: "o1", text: "apple" },
        { id: "o2", text: "banana" },
      ],
    },
  ] as unknown as DiagnosisStartResponse["questions"],
  totalQuestions: 1,
  timeLimit: 600,
};

const SUBMIT_RESPONSE: DiagnosisSubmitResponse = {
  diagnosisId: "diagnosis-1",
  totalScore: 45,
  cefrLevel: "B1",
  weaknessAreas: [],
  recommendedStartPoint: "B1",
};

const PREVIEW_RESPONSE: DiagnosisResult = {
  totalScore: 45,
  cefrLevel: "B1",
  weaknessAreas: [],
  recommendedStartPoint: "B1",
};

type HookResult = ReturnType<typeof useDiagnosisQuiz>;

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
let invalidateSpy: MockInstance<QueryClient["invalidateQueries"]>;
let resultRef: RefObject<HookResult | null>;

function Harness({
  isGuest,
  hookRef,
}: {
  isGuest: boolean;
  hookRef: RefObject<HookResult | null>;
}): null {
  const result = useDiagnosisQuiz(isGuest);
  useImperativeHandle(hookRef, () => result, [result]);
  return null;
}

// 마이크로태스크만 flush 하면 react-query 의 스케줄링을 항상 소진하지 못해
// 문항 로딩이 끝나기 전에 submit 이 no-op 되는 플레이키가 있었다.
// 매크로태스크(setTimeout 0)를 조건이 만족될 때까지 반복 flush 해 결정론적으로 만든다.
async function tick(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

async function waitUntil(condition: () => boolean, maxTicks = 50): Promise<void> {
  for (let attempt = 0; attempt < maxTicks && !condition(); attempt += 1) {
    await tick();
  }
}

async function renderHook(isGuest: boolean): Promise<void> {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Harness isGuest={isGuest} hookRef={resultRef} />
      </QueryClientProvider>
    );
  });
  // 문항 useQuery 가 resolve 되어야 submit 이 답안을 만든다.
  await waitUntil(() => (resultRef.current?.questions.length ?? 0) > 0);
}

async function submitAndFlush(): Promise<void> {
  await act(async () => {
    resultRef.current?.submit({ q1: "apple" });
  });
  // 뮤테이션 성공 + onSuccess(무효화·refresh) 정착까지 대기.
  await waitUntil(() => resultRef.current?.submitResult !== undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchDiagnosisQuestions.mockResolvedValue(START_RESPONSE);
  mocks.submitDiagnosis.mockResolvedValue(SUBMIT_RESPONSE);
  mocks.previewDiagnosis.mockResolvedValue(PREVIEW_RESPONSE);

  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  resultRef = { current: null };
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  queryClient.clear();
});

describe("useDiagnosisQuiz - 제출 성공 후 갱신", () => {
  it("인증 제출 성공 시 프로필·진단 캐시를 무효화하고 서버 트리를 refresh 한다", async () => {
    await renderHook(false);
    await submitAndFlush();

    expect(mocks.submitDiagnosis).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["diagnosis"],
      refetchType: "none",
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  // ["diagnosis"] 는 진행 중 문항 쿼리 ["diagnosis","start"] 의 접두사다.
  // 즉시 리페치하면 아직 마운트된 퀴즈의 문항이 새 세트로 교체돼 로컬 답안과 어긋난다.
  it("무효화가 진행 중 문항 쿼리를 다시 가져오지 않는다", async () => {
    await renderHook(false);
    const questionsBeforeSubmit = resultRef.current?.questions;

    await submitAndFlush();
    await tick();

    expect(mocks.fetchDiagnosisQuestions).toHaveBeenCalledTimes(1);
    expect(resultRef.current?.questions).toBe(questionsBeforeSubmit);
  });

  it("게스트(preview) 제출 성공 시에는 무효화·refresh 를 하지 않는다", async () => {
    await renderHook(true);
    await submitAndFlush();

    expect(mocks.previewDiagnosis).toHaveBeenCalledTimes(1);
    expect(mocks.submitDiagnosis).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
