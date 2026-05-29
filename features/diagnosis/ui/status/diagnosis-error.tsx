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
    <div className="min-h-screen bg-cream-canvas flex items-center justify-center px-4">
      <div className="tactile-card tactile-card--raised animate-[pop-in] relative max-w-md w-full overflow-hidden p-8 text-center">
        <span
          className="pointer-events-none absolute -bottom-6 -right-4 select-none text-8xl opacity-10"
          aria-hidden
        >
          ⚠️
        </span>
        <div className="relative">
          <div className="tactile-tile mx-auto mb-6 h-20 w-20 border-coral-edge bg-coral text-4xl">
            <span>⚠️</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <p className="mt-3 text-sm text-ink-soft">{description}</p>
          <button
            onClick={onRetry}
            className="tactile-btn tactile-btn--coral tactile-btn--lg mt-8"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
}
