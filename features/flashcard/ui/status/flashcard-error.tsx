interface FlashcardErrorProps {
  onRetry: () => void;
}

export function FlashcardError({ onRetry }: FlashcardErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
      <div className="tactile-card tactile-card--raised w-full max-w-md p-8 text-center animate-[pop-in]">
        <div className="tactile-tile mx-auto mb-5 h-16 w-16 border-coral bg-coral-tint text-3xl">
          <span>😢</span>
        </div>
        <h2 className="font-display text-xl font-bold text-ink">오류 발생</h2>
        <p className="mt-2 text-ink-soft">플래시카드를 불러올 수 없습니다.</p>
        <button
          onClick={onRetry}
          className="tactile-btn tactile-btn--coral tactile-btn--block mt-6"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
