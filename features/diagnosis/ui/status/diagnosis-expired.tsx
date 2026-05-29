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
    <div className="min-h-screen bg-cream-canvas flex items-center justify-center px-4">
      <div className="tactile-card tactile-card--raised animate-[pop-in] relative max-w-md w-full overflow-hidden p-8 text-center">
        <span
          className="pointer-events-none absolute -bottom-6 -right-4 select-none text-8xl opacity-10"
          aria-hidden
        >
          ⏰
        </span>
        <div className="relative">
          <div className="tactile-tile mx-auto mb-6 h-20 w-20 border-gold-edge bg-gold text-4xl">
            <span>⏰</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">
            시간이 만료되었습니다
          </h2>

          <div className="mx-auto mt-5 flex items-center justify-center gap-3">
            <div className="rounded-2xl border-2 border-border-warm bg-muted-warm px-5 py-3">
              <p className="text-xs text-ink-soft">답변</p>
              <p className="font-display text-2xl font-bold text-ink">
                {answeredCount}
              </p>
            </div>
            <span className="font-display text-xl font-bold text-ink-soft">/</span>
            <div className="rounded-2xl border-2 border-teal bg-teal-tint px-5 py-3">
              <p className="text-xs text-teal-edge">필요</p>
              <p className="font-display text-2xl font-bold text-teal-edge">
                {requiredCount}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm text-ink-soft">
            정확한 진단을 위해 최소 {requiredCount}개 문항에 답변해야 합니다. 다시
            시도해 주세요.
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
              className="tactile-btn tactile-btn--ghost tactile-btn--block"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
