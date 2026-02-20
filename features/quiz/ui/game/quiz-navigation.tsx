import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

interface QuizNavigationProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isAnswered: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function getIsNextDisabled(isLastQuestion: boolean, isAnswered: boolean, canSubmit: boolean, isSubmitting: boolean) {
  if (isSubmitting) {
    return true;
  }

  if (isLastQuestion) {
    return !canSubmit;
  }

  return !isAnswered;
}

export function QuizNavigation({
  isFirstQuestion,
  isLastQuestion,
  isAnswered,
  canSubmit,
  isSubmitting,
  onPrevious,
  onNext,
}: QuizNavigationProps) {
  const isNextDisabled = getIsNextDisabled(isLastQuestion, isAnswered, canSubmit, isSubmitting);
  const showSubmittingState = isLastQuestion && isSubmitting;
  const showCompleteState = isLastQuestion && !isSubmitting;
  const showNextState = !isLastQuestion;

  return (
    <div className="relative z-10 flex-shrink-0 px-4 pb-4 pt-2">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion || isSubmitting}
            className="px-5 py-2.5 bg-white/10 backdrop-blur-xl text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전</span>
          </button>

          <div className="flex-1 text-center">
            {!isAnswered && <p className="text-xs text-violet-300 animate-pulse font-medium">답을 선택하세요</p>}
          </div>

          <button
            onClick={onNext}
            disabled={isNextDisabled}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-black rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center gap-2 text-sm"
          >
            {showSubmittingState && (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                <span>제출 중...</span>
              </>
            )}
            {showCompleteState && (
              <>
                <span>완료</span>
                <Check className="w-4 h-4" />
              </>
            )}
            {showNextState && (
              <>
                <span>다음</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

