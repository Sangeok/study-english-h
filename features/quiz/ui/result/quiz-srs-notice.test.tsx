import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizSummary } from "../../types";
import { QuizSrsNotice } from "./quiz-srs-notice";

let container: HTMLDivElement;
let root: Root;

async function renderNotice(
  srs: QuizSummary["srs"],
  onGoReview: () => void = vi.fn()
): Promise<() => void> {
  await act(async () => {
    root.render(<QuizSrsNotice srs={srs} onGoReview={onGoReview} />);
  });

  return onGoReview;
}

function getCtaButton(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>("button");

  if (!button) {
    throw new Error("복습하러 가기 버튼을 찾을 수 없습니다.");
  }

  return button;
}

describe("QuizSrsNotice", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

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

  it("편입 실패(null)면 아무것도 렌더링하지 않는다", async () => {
    await renderNotice(null);

    expect(container.textContent).toBe("");
  });

  it("편입 대상이 0건이면 아무것도 렌더링하지 않는다", async () => {
    await renderNotice({ enrolledCount: 0 });

    expect(container.textContent).toBe("");
  });

  it("편입된 단어가 있으면 개수와 CTA를 표시한다", async () => {
    await renderNotice({ enrolledCount: 3 });

    expect(container.textContent).toContain("틀린 단어");
    expect(container.textContent).toContain("3개");
    expect(container.textContent).toContain("복습에 추가되었어요");
    expect(getCtaButton().textContent).toContain("복습하러 가기");
  });

  it("CTA 클릭 시 주입된 onGoReview 콜백을 호출한다 (리프는 라우터를 모른다)", async () => {
    const onGoReview = vi.fn();
    await renderNotice({ enrolledCount: 3 }, onGoReview);

    await act(async () => {
      getCtaButton().click();
    });

    expect(onGoReview).toHaveBeenCalledTimes(1);
  });
});
