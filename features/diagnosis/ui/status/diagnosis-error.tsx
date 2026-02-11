interface DiagnosisErrorProps {
  title?: string;
  description?: string;
  onRetry: () => void;
}

export function DiagnosisError({
  title = "문제를 불러올 수 없어요",
  description = "네트워크 연결을 확인하고 다시 시도해주세요.",
  onRetry,
}: DiagnosisErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-950 mb-3">{title}</h2>
        <p className="text-purple-700 mb-8">{description}</p>
        <button
          onClick={onRetry}
          className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
