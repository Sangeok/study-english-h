interface ResultActionsProps {
  onStartStudy: () => void;
  onGoHome: () => void;
}

export function ResultActions({ onStartStudy, onGoHome }: ResultActionsProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        onClick={onStartStudy}
        className="tactile-btn tactile-btn--teal tactile-btn--lg tactile-btn--block flex-1"
      >
        맞춤 학습 시작하기 →
      </button>
      <button
        onClick={onGoHome}
        className="tactile-btn tactile-btn--ghost tactile-btn--lg tactile-btn--block flex-1"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
