interface DiagnosisLoadingProps {
  title?: string;
  description?: string;
}

export function DiagnosisLoading({
  title = "문제 준비 중",
  description = "잠시만 기다려주세요",
}: DiagnosisLoadingProps) {
  return (
    <div className="min-h-screen bg-chamber flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-chamber-line" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cobalt-lt" />
        </div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-cobalt-lt">
          Loading
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-chamber-ink">{title}</h2>
        <p className="mt-2 text-sm text-chamber-soft">{description}</p>
      </div>
    </div>
  );
}
