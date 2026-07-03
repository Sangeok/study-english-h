interface DiagnosisLoadingProps {
  title?: string;
  description?: string;
}

export function DiagnosisLoading({
  title = "문제 준비 중...",
  description = "잠시만 기다려주세요",
}: DiagnosisLoadingProps) {
  return (
    <div className="min-h-screen bg-cream-canvas flex items-center justify-center px-4">
      <div className="tactile-card tactile-card--raised animate-[pop-in] max-w-sm w-full p-10 text-center">
        <div className="relative mx-auto mb-6 h-24 w-24">
          <div className="absolute inset-0 rounded-full border-4 border-teal-tint" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-teal" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce-gentle">
            📝
          </div>
        </div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-teal-edge">
          Loading
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
