interface FlashcardErrorProps {
  onRetry: () => void;
}

export function FlashcardError({ onRetry }: FlashcardErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-chamber px-4">
      <div className="w-full max-w-md rounded-2xl border border-chamber-line bg-chamber-panel p-8 text-center animate-[pop-in]">
        <h2 className="font-display text-xl font-bold text-chamber-ink">플래시카드를 불러올 수 없어요</h2>
        <p className="mt-2 text-chamber-soft">네트워크 연결을 확인하고 다시 시도해주세요.</p>
        <button
          onClick={onRetry}
          className="tactile-btn tactile-btn--teal tactile-btn--block mt-6"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
