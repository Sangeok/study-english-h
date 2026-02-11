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
      className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-3"
    >
      {isSubmitting && (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {isSubmitting && <span>제출 중...</span>}
      {!isSubmitting && <span>제출하기</span>}
      {!isSubmitting && <span className="text-xl">🎯</span>}
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
      className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
    >
      <span>다음</span>
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
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
        className="px-6 py-4 bg-white/80 backdrop-blur-md text-purple-900 font-semibold rounded-2xl border border-purple-200 hover:bg-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>이전</span>
      </button>

      <div className="flex-1 text-center">
        {!hasCurrentAnswer && (
          <p className="text-sm text-purple-700 animate-pulse">
            답을 선택해주세요
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
