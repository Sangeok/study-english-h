interface FlashcardProgressBarProps {
  current: number;
  total: number;
  progress: number;
}

export function FlashcardProgressBar({ current, total, progress }: FlashcardProgressBarProps) {
  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {current} / {total}
        </span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
      <div
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Flashcard session progress"
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
