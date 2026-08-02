/**
 * 정답률 카드 — 유형별 집계 줄의 회귀.
 *
 * 이 파일이 생긴 이유: 수동 검증에서 화면이 "1 / 10 정답"이라 말하는데 상세 결과에는
 * 읽기 7행만 나오는 상태를 발견했다. results[] 는 읽기 행만 담고(리스닝·타이핑은
 * QuizResult 유니온을 넓히지 않기로 했다) 그 차이를 메우는 줄이 없었다.
 *
 * API 계약 테스트(summary.total === 10)는 통과하고 있었다 — 그 값이 **화면에 어떻게
 * 나타나는지**를 아무도 단언하지 않아서 생긴 구멍이다.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizSummary } from "../../types";
import { QuizAccuracyCard } from "./quiz-accuracy-card";

let container: HTMLDivElement;
let root: Root;

function makeSummary(overrides: Partial<QuizSummary> = {}): QuizSummary {
  return {
    total: 10,
    correct: 7,
    accuracy: 70,
    xpEarned: 100,
    xpPenaltyFromHints: 0,
    hintStats: { noHintCorrect: 7, partialHintCorrect: 0, fullHintCorrect: 0 },
    listeningCount: 3,
    listeningCorrect: 2,
    typingCount: 2,
    typingCorrect: 1,
    srs: { enrolledCount: 10 },
    ...overrides,
  };
}

async function render(summary: QuizSummary): Promise<void> {
  await act(async () => {
    root.render(
      <QuizAccuracyCard
        summary={summary}
        xpCounter={summary.xpEarned}
        isExtraPractice={false}
        currentStreak={1}
      />
    );
  });
}

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

describe("유형별 집계 줄", () => {
  it("세 유형이 섞인 세션에서 각 유형의 정답/문항을 보여준다", async () => {
    // 총 10 중 듣기 3 · 쓰기 2 → 읽기는 5. 정답 7 중 듣기 2 · 쓰기 1 → 읽기 4.
    await render(makeSummary());

    const text = container.textContent ?? "";
    expect(text).toContain("읽기 4/5");
    expect(text).toContain("듣기 2/3");
    expect(text).toContain("쓰기 1/2");
  });

  it("총계와 상세 행 수가 어긋나도 사용자가 이유를 알 수 있다", async () => {
    // 이것이 이 줄의 존재 이유다 — "7 / 10 정답"인데 상세는 5행뿐인 상황.
    await render(makeSummary());

    expect(container.textContent).toContain("7 / 10 정답");
    expect(container.textContent).toContain("듣기 2/3");
  });

  it("듣기를 끈 세션(읽기만)에서는 줄을 감춘다 — 총계와 같은 말이라 중복이다", async () => {
    await render(
      makeSummary({ total: 10, correct: 7, listeningCount: 0, listeningCorrect: 0, typingCount: 0, typingCorrect: 0 })
    );

    const text = container.textContent ?? "";
    expect(text).toContain("7 / 10 정답");
    expect(text).not.toContain("읽기 ");
    expect(text).not.toContain("듣기 ");
  });

  it("타이핑이 0인 세션(신규 사용자)에서는 쓰기 항목만 빠진다", async () => {
    await render(makeSummary({ total: 10, correct: 6, typingCount: 0, typingCorrect: 0 }));

    const text = container.textContent ?? "";
    expect(text).toContain("읽기 4/7");
    expect(text).toContain("듣기 2/3");
    expect(text).not.toContain("쓰기");
  });
});
