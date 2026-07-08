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
      title: "복습할 단어가 없어요",
      description: "새로운 단어를 학습해보세요.",
      buttonText: "새로운 단어 학습하기",
      alternateMode: "new",
    };
  }

  return {
    title: "새로운 단어가 없어요",
    description: "복습할 단어를 확인해보세요.",
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
    <div className="flex min-h-screen items-center justify-center bg-chamber px-4">
      <div className="w-full max-w-md rounded-2xl border border-chamber-line bg-chamber-panel p-8 text-center animate-[pop-in]">
        <h2 className="font-display text-2xl font-bold text-chamber-ink">{content.title}</h2>
        <p className="mt-2 text-chamber-soft">{content.description}</p>
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
