interface QuizFeedbackActionsProps {
  onGoMain: () => void;
  onRetry: () => void;
}

export function QuizFeedbackActions({ onGoMain, onRetry }: QuizFeedbackActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.6s" }}>
      <button
        onClick={onGoMain}
        className="flex-1 py-5 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
      >
        <span>메인으로 돌아가기</span>
        <span className="text-2xl">🏠</span>
      </button>
      <button
        onClick={onRetry}
        className="sm:w-48 py-5 bg-white/80 backdrop-blur-md text-purple-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-purple-200 flex items-center justify-center gap-2"
      >
        <span>다시 풀기</span>
        <span className="text-xl">🔄</span>
      </button>
    </div>
  );
}
