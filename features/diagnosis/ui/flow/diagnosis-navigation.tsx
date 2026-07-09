interface DiagnosisNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  hasCurrentAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function SubmitButton({
  canSubmit,
  isSubmitting,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <button
      onClick={onSubmit}
      disabled={!canSubmit || isSubmitting}
      className="tactile-btn tactile-btn--teal tactile-btn--lg"
    >
      {isSubmitting && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {isSubmitting && <span>제출 중...</span>}
      {!isSubmitting && <span>제출하기</span>}
    </button>
  );
}

function NextButton({
  isSubmitting,
  onNext,
}: {
  isSubmitting: boolean;
  onNext: () => void;
}) {
  return (
    <button
      onClick={onNext}
      disabled={isSubmitting}
      className="tactile-btn tactile-btn--teal tactile-btn--lg"
    >
      <span>다음</span>
      <span className="text-xl">→</span>
    </button>
  );
}

export function DiagnosisNavigation({
  currentIndex,
  isLastQuestion,
  canSubmit,
  isSubmitting,
  hasCurrentAnswer,
  onPrevious,
  onNext,
  onSubmit,
}: DiagnosisNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0 || isSubmitting}
        className="tactile-btn tactile-btn--ghost tactile-btn--lg border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
      >
        <span className="text-xl">←</span>
        <span>이전</span>
      </button>

      <div className="flex-1 text-center">
        {!hasCurrentAnswer && (
          <p className="animate-pulse text-sm font-medium text-chamber-soft">
            답을 골라주세요
          </p>
        )}
      </div>

      {isLastQuestion && (
        <SubmitButton
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      )}
      {!isLastQuestion && (
        <NextButton isSubmitting={isSubmitting} onNext={onNext} />
      )}
    </div>
  );
}
