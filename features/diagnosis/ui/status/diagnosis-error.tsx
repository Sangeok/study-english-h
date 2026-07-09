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
    <div className="min-h-screen bg-chamber flex items-center justify-center px-4">
      <div className="animate-[pop-in] w-full max-w-md rounded-2xl border border-chamber-line bg-chamber-panel p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-chamber-ink">{title}</h2>
        <p className="mt-3 text-sm text-chamber-soft">{description}</p>
        <button
          onClick={onRetry}
          className="tactile-btn tactile-btn--teal tactile-btn--lg mt-8"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
