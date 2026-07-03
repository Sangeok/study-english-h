import type { SessionMode } from "../../types";

interface EmptyStateContent {
  title: string;
  description: string;
  buttonText: string;
  alternateMode: SessionMode;
}

function getEmptyStateContent(mode: SessionMode): EmptyStateContent {
  if (mode === "review") {
    return {
      title: "복습할 단어가 없습니다",
      description: "새로운 단어를 학습해보세요!",
      buttonText: "새로운 단어 학습하기",
      alternateMode: "new",
    };
  }

  return {
    title: "새로운 단어가 없습니다",
    description: "복습할 단어를 확인해보세요!",
    buttonText: "복습하기",
    alternateMode: "review",
  };
}

interface FlashcardEmptyProps {
  mode: SessionMode;
  onSwitchMode: (mode: SessionMode) => void;
}

export function FlashcardEmpty({ mode, onSwitchMode }: FlashcardEmptyProps) {
  const content = getEmptyStateContent(mode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
      <div className="tactile-card tactile-card--raised w-full max-w-md p-8 text-center animate-[pop-in]">
        <div className="tactile-tile mx-auto mb-5 h-16 w-16 border-ocean bg-ocean-tint text-3xl">
          <span>📚</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">{content.title}</h2>
        <p className="mt-2 text-ink-soft">{content.description}</p>
        <button
          onClick={() => onSwitchMode(content.alternateMode)}
          className="tactile-btn tactile-btn--teal tactile-btn--block tactile-btn--lg mt-6"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
}
