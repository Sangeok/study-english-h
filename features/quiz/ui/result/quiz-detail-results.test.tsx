import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizResult } from "../../types";
import { QuizDetailResults } from "./quiz-detail-results";

const mocks = vi.hoisted(() => ({
  playAudio: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/shared/lib/play-audio", () => ({
  playAudio: mocks.playAudio,
}));

vi.mock("@/shared/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

const RESULT: QuizResult = {
  questionId: "question-1",
  isCorrect: true,
  correctAnswer: "reads",
  explanation: "She _____ books every day.",
  sentenceAudioUrl: "https://cdn.example/quiz-sentences/question-1.mp3",
};

const UNSUPPORTED_MESSAGE =
  "이 브라우저에서는 발음 재생을 지원하지 않아요.";

let container: HTMLDivElement;
let root: Root;

async function renderResults(result: QuizResult = RESULT): Promise<void> {
  await act(async () => {
    root.render(
      <QuizDetailResults
        results={[result]}
        showDetails
        onToggle={vi.fn()}
      />
    );
  });
}

async function clickPlayButton(): Promise<void> {
  const button = container.querySelector<HTMLButtonElement>(
    'button[aria-label="문장 발음 듣기"]'
  );

  if (!button) {
    throw new Error("문장 발음 듣기 버튼을 찾을 수 없습니다.");
  }

  await act(async () => {
    button.click();
    await Promise.resolve();
  });
}

describe("QuizDetailResults audio playback", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.playAudio.mockReset();
    mocks.toast.mockReset();

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

  it("문장 듣기 버튼은 완성 문장과 오디오 URL로 재생을 요청한다", async () => {
    mocks.playAudio.mockResolvedValue(true);
    await renderResults();

    await clickPlayButton();

    expect(mocks.playAudio).toHaveBeenCalledWith(
      "She reads books every day.",
      RESULT.sentenceAudioUrl
    );
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("오디오 URL이 없고 재생 수단도 없으면 미지원 안내를 표시한다", async () => {
    mocks.playAudio.mockResolvedValue(false);
    await renderResults({ ...RESULT, sentenceAudioUrl: undefined });

    await clickPlayButton();

    expect(mocks.playAudio).toHaveBeenCalledWith(
      "She reads books every day.",
      undefined
    );
    expect(mocks.toast).toHaveBeenCalledWith(UNSUPPORTED_MESSAGE);
  });
});
