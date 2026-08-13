/**
 * use-quiz-navigation — 복원된 진행 인덱스에서 시작하는지.
 *
 * @testing-library/react 가 없으므로 use-quiz-answers.test.tsx 의 하네스 패턴을 따른다.
 */
import { createRef, useImperativeHandle, type RefObject } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useQuizNavigation } from "./use-quiz-navigation";

type HookResult = ReturnType<typeof useQuizNavigation>;

let container: HTMLDivElement;
let root: Root;
let hookRef: RefObject<HookResult | null>;

function Harness({
  totalQuestions,
  initialIndex,
}: {
  totalQuestions: number;
  initialIndex?: number;
}): null {
  const result = useQuizNavigation(totalQuestions, () => {}, initialIndex);
  useImperativeHandle(hookRef, () => result, [result]);
  return null;
}

async function render(totalQuestions: number, initialIndex?: number): Promise<void> {
  await act(async () => {
    root.render(<Harness totalQuestions={totalQuestions} initialIndex={initialIndex} />);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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

describe("초기 인덱스", () => {
  it("복원된 인덱스에서 시작한다", async () => {
    await render(10, 6);

    expect(hookRef.current?.currentIndex).toBe(6);
  });

  it("인자가 없으면 첫 문항에서 시작한다 — 기존 동작 보존", async () => {
    await render(10);

    expect(hookRef.current?.currentIndex).toBe(0);
  });

  it("문항 수를 넘는 인덱스는 첫 문항으로 되돌린다 — clampIndex 이중 방어", async () => {
    await render(3, 99);

    expect(hookRef.current?.currentIndex).toBe(0);
  });
});
