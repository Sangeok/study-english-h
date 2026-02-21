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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <p className="text-4xl">📚</p>
        <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
        <p className="text-gray-600">{content.description}</p>
        <button
          onClick={() => onSwitchMode(content.alternateMode)}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
}
