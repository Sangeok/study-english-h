interface QuizFeedbackActionsProps {
  onGoMain: () => void;
  onRetry: () => void;
  isExtraPractice: boolean;
}

export function QuizFeedbackActions({ onGoMain, onRetry, isExtraPractice }: QuizFeedbackActionsProps) {
  const retryLabel = isExtraPractice ? "한 번 더 연습하기" : "추가 연습하기";

  return (
    <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.6s" }}>
      <button
        onClick={onGoMain}
        className="tactile-btn tactile-btn--teal tactile-btn--lg flex-1"
      >
        <span>메인으로 돌아가기</span>
        <span className="text-2xl">🏠</span>
      </button>
      <button
        onClick={onRetry}
        className="tactile-btn tactile-btn--ghost tactile-btn--lg sm:w-48"
      >
        <span>{retryLabel}</span>
        <span className="text-xl">🔄</span>
      </button>
    </div>
  );
}
