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
    <div className="min-h-screen bg-chamber flex items-center justify-center px-4">
      <div className="animate-[pop-in] w-full max-w-md rounded-2xl border border-chamber-line bg-chamber-panel p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-chamber-ink">
          시간이 다 됐어요
        </h2>

        <div className="mx-auto mt-5 flex items-center justify-center gap-3">
          <div className="rounded-2xl border border-chamber-line bg-chamber-panel-hi px-5 py-3">
            <p className="text-xs text-chamber-soft">답변</p>
            <p className="font-display text-2xl font-bold text-chamber-ink tabular-nums">
              {answeredCount}
            </p>
          </div>
          <span className="font-display text-xl font-bold text-chamber-soft">/</span>
          <div className="rounded-2xl border border-cobalt-lt bg-chamber-panel-hi px-5 py-3">
            <p className="text-xs text-cobalt-lt">필요</p>
            <p className="font-display text-2xl font-bold text-cobalt-lt tabular-nums">
              {requiredCount}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-chamber-soft">
          정확한 진단을 위해 최소 {requiredCount}개 문항에 답해야 해요. 다시 시도해
          주세요.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="tactile-btn tactile-btn--teal tactile-btn--lg tactile-btn--block"
          >
            다시 시도하기
          </button>
          <button
            onClick={onGoHome}
            className="tactile-btn tactile-btn--ghost tactile-btn--block border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
