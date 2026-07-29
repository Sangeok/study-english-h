interface FlashcardProgressBarProps {
  /** 지금 무슨 세션인지("복습" 등) — 화면만 보고 알 수 있어야 한다. */
  label: string;
  current: number;
  total: number;
  progress: number;
}

export function FlashcardProgressBar({
  label,
  current,
  total,
  progress,
}: FlashcardProgressBarProps) {
  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="mb-2 flex items-end justify-between">
        <span className="font-display text-lg font-bold text-chamber-ink tabular-nums">
          <span className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-cobalt-lt">
            {label}
          </span>
          {current}
          <span className="text-sm font-semibold text-chamber-soft"> / {total}</span>
        </span>
        <span className="font-display text-lg font-bold text-cobalt-lt tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
      <div
        className="tactile-progress bg-[#1b2a44]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Flashcard session progress"
      >
        <div className="tactile-progress__fill bg-cobalt-lt" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
