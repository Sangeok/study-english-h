/**
 * use-daily-quiz — 복원본이 있으면 서버를 치지 않는다.
 *
 * 이 계약이 깨지면 복원이 무의미해진다: 페치가 돌면 새로 뽑힌 문항이 화면에 오고
 * 복원된 답안은 다시 고아가 된다(그게 애초에 고치려던 결함이다).
 * react-query 의 `initialData` + `staleTime: Infinity` 조합에 기대는 부분이라
 * 라이브러리 동작 자체를 여기서 못박는다.
 */
import { Suspense, createRef, useImperativeHandle, type RefObject } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDailyQuiz } from "./use-daily-quiz";
import { fetchDailyQuiz } from "../api/quiz-api";
import type { DailyQuizResponse } from "../types";

vi.mock("../api/quiz-api", () => ({ fetchDailyQuiz: vi.fn() }));

const fetchMock = vi.mocked(fetchDailyQuiz);

const RESPONSE: DailyQuizResponse = {
  questions: [
    {
      type: "reading",
      id: "q1",
      koreanHint: "빌리다",
      contextHint: null,
      sentence: "I want to ___ a book.",
      difficulty: "A1",
      category: "daily",
      options: [{ text: "borrow" }, { text: "freeze" }],
    },
  ],
  userLevel: "A1",
  totalQuestions: 1,
  hasCompletedToday: false,
  freeHintCount: 0,
};

type HookResult = ReturnType<typeof useDailyQuiz>;

let container: HTMLDivElement;
let root: Root;
let hookRef: RefObject<HookResult | null>;
let queryClient: QueryClient;

function Inner({ restored }: { restored?: DailyQuizResponse }): null {
  const result = useDailyQuiz(true, restored);
  useImperativeHandle(hookRef, () => result, [result]);
  return null;
}

async function render(restored?: DailyQuizResponse): Promise<void> {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
          <Inner restored={restored} />
        </Suspense>
      </QueryClientProvider>
    );
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ...RESPONSE, userLevel: "B1" });

  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe("복원본이 있을 때", () => {
  it("서버를 치지 않는다", async () => {
    await render(RESPONSE);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("복원본을 그대로 내보낸다 — 서버 응답(B1)이 아니라 스냅샷 값(A1)이다", async () => {
    await render(RESPONSE);

    expect(hookRef.current?.userLevel).toBe("A1");
    expect(hookRef.current?.questions).toHaveLength(1);
  });
});

describe("복원본이 없을 때", () => {
  it("서버에서 새로 받아온다 — 기존 동작 보존", async () => {
    await render();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hookRef.current?.userLevel).toBe("B1");
  });
});
