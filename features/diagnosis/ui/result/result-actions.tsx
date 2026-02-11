interface ResultActionsProps {
  onStartStudy: () => void;
  onGoHome: () => void;
}

export function ResultActions({ onStartStudy, onGoHome }: ResultActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <button
        onClick={onStartStudy}
        className="flex-1 px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
      >
        맞춤 학습 시작하기
      </button>
      <button
        onClick={onGoHome}
        className="flex-1 px-8 py-4 bg-white/80 backdrop-blur-md text-purple-900 font-semibold rounded-2xl border border-purple-200 hover:bg-white hover:shadow-lg transition-all duration-300"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
