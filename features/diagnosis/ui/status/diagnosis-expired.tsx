interface DiagnosisExpiredProps {
  answeredCount: number;
  requiredCount: number;
  onGoHome: () => void;
  onRetry: () => void;
}

export function DiagnosisExpired({
  answeredCount,
  requiredCount,
  onGoHome,
  onRetry,
}: DiagnosisExpiredProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏰</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-purple-950 mb-3">
          시간이 만료되었습니다
        </h2>
        <p className="text-purple-700 mb-2">
          {answeredCount}개 문항에 답변하셨습니다.
        </p>
        <p className="text-purple-700 mb-8">
          정확한 진단을 위해 최소 {requiredCount}개 문항에 답변해야 합니다. 다시
          시도해 주세요.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            다시 시도하기
          </button>
          <button
            onClick={onGoHome}
            className="px-8 py-4 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
