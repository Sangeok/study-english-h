import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VocabularyCard } from "../../types";
import { FlashcardGame } from "./flashcard-game";

const mocks = vi.hoisted(() => ({
  playAudio: vi.fn(),
  toast: vi.fn(),
  useFlashcardGameFlow: vi.fn(),
}));

vi.mock("@/shared/lib/play-audio", () => ({
  playAudio: mocks.playAudio,
}));

vi.mock("@/shared/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("../../hooks/use-flashcard-game-flow", () => ({
  useFlashcardGameFlow: mocks.useFlashcardGameFlow,
}));

const CARD: VocabularyCard = {
  id: "vocabulary-1",
  word: "apple",
  meaning: "사과",
  exampleSentence: "I ate an apple.",
  audioUrl: "https://cdn.example/words/apple.mp3",
  exampleAudioUrl: "https://cdn.example/examples/apple.mp3",
  masteryLevel: "new",
  nextReviewDate: "2026-07-12T00:00:00.000Z",
};

const PLAYBACK_CASES = [
  {
    buttonLabel: "발음 듣기",
    expectedText: CARD.word,
    expectedUrl: CARD.audioUrl,
  },
  {
    buttonLabel: "예문 듣기",
    expectedText: CARD.exampleSentence,
    expectedUrl: CARD.exampleAudioUrl,
  },
] as const;

const UNSUPPORTED_MESSAGE =
  "이 브라우저에서는 발음 재생을 지원하지 않아요.";

let container: HTMLDivElement;
let root: Root;

async function renderGame(): Promise<void> {
  await act(async () => {
    root.render(
      <FlashcardGame
        cards={[CARD]}
        isPending={false}
        onSubmitReviews={vi.fn()}
        startCardTimer={vi.fn()}
        getCardTime={vi.fn(() => 0)}
        getSessionDuration={vi.fn(() => 0)}
      />
    );
  });
}

async function clickButton(label: string): Promise<void> {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`버튼을 찾을 수 없습니다: ${label}`);
  }

  await act(async () => {
    button.click();
    await Promise.resolve();
  });
}

describe("FlashcardGame audio playback", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.playAudio.mockReset();
    mocks.toast.mockReset();
    mocks.useFlashcardGameFlow.mockReset();
    mocks.useFlashcardGameFlow.mockReturnValue({
      currentIndex: 0,
      isFlipped: false,
      currentCard: CARD,
      progress: 0,
      handleFlip: vi.fn(),
      handleReview: vi.fn(),
    });

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

  it.each(PLAYBACK_CASES)(
    "$buttonLabel 버튼은 해당 텍스트와 URL로 재생을 요청한다",
    async ({ buttonLabel, expectedText, expectedUrl }) => {
      mocks.playAudio.mockResolvedValue(true);
      await renderGame();

      await clickButton(buttonLabel);

      expect(mocks.playAudio).toHaveBeenCalledWith(expectedText, expectedUrl);
      expect(mocks.toast).not.toHaveBeenCalled();
    }
  );

  it.each(PLAYBACK_CASES)(
    "$buttonLabel 재생 수단이 없으면 미지원 안내를 표시한다",
    async ({ buttonLabel }) => {
      mocks.playAudio.mockResolvedValue(false);
      await renderGame();

      await clickButton(buttonLabel);

      expect(mocks.toast).toHaveBeenCalledWith(UNSUPPORTED_MESSAGE);
    }
  );
});
