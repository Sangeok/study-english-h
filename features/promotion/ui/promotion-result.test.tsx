import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROMOTION } from "@/shared/constants";
import type { PromotionSubmitResponse } from "../api/promotion-api";
import { PromotionResult } from "./promotion-result";

let container: HTMLDivElement;
let root: Root;

async function renderResult(
  result: PromotionSubmitResponse,
  onGoHome: () => void = vi.fn()
): Promise<() => void> {
  await act(async () => {
    root.render(<PromotionResult result={result} onGoHome={onGoHome} />);
  });

  return onGoHome;
}

function getHomeButton(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>("button");

  if (!button) {
    throw new Error("홈으로 버튼을 찾을 수 없습니다.");
  }

  return button;
}

describe("PromotionResult", () => {
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

  it("통과하면 새 레벨을 말한다", async () => {
    await renderResult({ passed: true, correctCount: 9, newLevel: "B2" });

    expect(container.textContent).toContain("B2");
    expect(container.textContent).toContain(`${PROMOTION.QUESTION_COUNT}문항 중`);
    expect(container.textContent).toContain("9");
  });

  it("통과 화면에는 쿨다운·편입 안내가 없다", async () => {
    await renderResult({ passed: true, correctCount: 10, newLevel: "B2" });

    expect(container.textContent).not.toContain("재응시");
    expect(container.textContent).not.toContain("복습 목록");
  });

  it("미달이면 통과 기준과 쿨다운을 함께 말한다", async () => {
    await renderResult({ passed: false, correctCount: 7, enrolledCount: 3 });

    expect(container.textContent).toContain(`통과 기준 ${PROMOTION.PASS_COUNT}문항`);
    expect(container.textContent).toContain(`${PROMOTION.RETRY_COOLDOWN_DAYS}일`);
  });

  it("틀린 개수는 correctCount 에서 파생한다 — enrolledCount 가 아니다", async () => {
    // 계약: enrolledCount 는 matched-and-committed 수라, 미연결 단어가 탈락하면
    //   틀린 수보다 작다. 이걸 "틀린 N개"로 쓰면 사용자에게 거짓말이 된다.
    await renderResult({ passed: false, correctCount: 7, enrolledCount: 2 });

    // 틀린 것은 3개(10-7)고 편입된 것은 2개다 — 둘 다 제 자리에 나와야 한다.
    expect(container.textContent).toContain("틀린 3개");
    expect(container.textContent).toContain("2개");
  });

  it("편입이 실패(null)하면 숫자 없는 중립 카피로 떨어진다", async () => {
    await renderResult({ passed: false, correctCount: 6, enrolledCount: null });

    expect(container.textContent).toContain("복습으로 다시 만나요");
    expect(container.textContent).not.toContain("틀린 4개 중");
  });

  it("편입 대상이 0건이어도 중립 카피를 쓴다 (0개 담았어요 금지)", async () => {
    await renderResult({ passed: false, correctCount: 6, enrolledCount: 0 });

    expect(container.textContent).toContain("복습으로 다시 만나요");
    expect(container.textContent).not.toContain("0개를");
  });

  it("홈 버튼은 주입된 콜백을 부른다 (리프는 라우터를 모른다)", async () => {
    const onGoHome = vi.fn();
    await renderResult({ passed: true, correctCount: 10, newLevel: "B2" }, onGoHome);

    await act(async () => {
      getHomeButton().click();
    });

    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
