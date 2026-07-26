import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FlashcardEmpty } from "./flashcard-empty";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

let container: HTMLDivElement;
let root: Root;

function render(mode: "review" | "new"): void {
  act(() => {
    root.render(<FlashcardEmpty mode={mode} />);
  });
}

function links(): { href: string | null; text: string }[] {
  return Array.from(container.querySelectorAll("a")).map((anchor) => ({
    href: anchor.getAttribute("href"),
    text: anchor.textContent?.trim() ?? "",
  }));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("FlashcardEmpty", () => {
  // 이 폴백이 복습 세션에서 신규 학습으로 새는 유일한 경로였다 — 새 단어는 퀴즈에서만 만난다(ADR 0002).
  it("복습 큐가 비어도 신규 학습으로 유도하지 않고 퀴즈로 보낸다", () => {
    render("review");

    expect(container.textContent).toContain("밀린 복습이 없어요");
    expect(container.textContent).not.toContain("새로운 단어");
    expect(links()).toEqual([{ href: "/quiz", text: "오늘 퀴즈 풀기" }]);
  });

  it("URL 로만 도달하는 신규 세션이 비면 홈으로 돌려보낸다", () => {
    render("new");

    expect(links()).toEqual([{ href: "/", text: "홈으로" }]);
  });
});
