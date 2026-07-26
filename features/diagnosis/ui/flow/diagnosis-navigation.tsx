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

// 미응답 안내 문구 = 다음·제출 버튼이 비활성인 사유. aria-describedby 로 연결한다.
const UNANSWERED_HINT_ID = "diagnosis-unanswered-hint";

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
      aria-describedby={canSubmit ? undefined : UNANSWERED_HINT_ID}
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
  hasCurrentAnswer,
  isSubmitting,
  onNext,
}: {
  hasCurrentAnswer: boolean;
  isSubmitting: boolean;
  onNext: () => void;
}) {
  return (
    <button
      onClick={onNext}
      // 답을 고르지 않은 문항은 건너뛸 수 없다 — 진단 점수의 빈칸을 원천 차단.
      disabled={!hasCurrentAnswer || isSubmitting}
      aria-describedby={hasCurrentAnswer ? undefined : UNANSWERED_HINT_ID}
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
          <p
            id={UNANSWERED_HINT_ID}
            className="animate-pulse text-sm font-medium text-chamber-soft"
          >
            답을 골라야 다음 문항으로 넘어가요
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
        <NextButton
          hasCurrentAnswer={hasCurrentAnswer}
          isSubmitting={isSubmitting}
          onNext={onNext}
        />
      )}
    </div>
  );
}
