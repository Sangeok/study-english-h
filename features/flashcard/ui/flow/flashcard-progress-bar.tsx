interface FlashcardProgressBarProps {
  current: number;
  total: number;
  progress: number;
}

export function FlashcardProgressBar({ current, total, progress }: FlashcardProgressBarProps) {
  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="mb-2 flex items-end justify-between">
        <span className="font-display text-lg font-bold text-ink">
          {current}
          <span className="text-sm font-semibold text-ink-soft"> / {total}</span>
        </span>
        <span className="font-display text-lg font-bold text-teal-edge">
          {Math.round(progress)}%
        </span>
      </div>
      <div
        className="tactile-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Flashcard session progress"
      >
        <div className="tactile-progress__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
