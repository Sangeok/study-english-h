interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  userLevel: string;
}

export function QuizHeader({ currentIndex, totalQuestions, answeredCount, userLevel }: QuizHeaderProps) {
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="relative z-10 flex-shrink-0 px-4 pt-3 pb-2">
      <div className="max-w-5xl mx-auto">
        <div className="tactile-card px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="tactile-tile w-10 h-10 bg-teal border-teal-edge text-xl">
                <span>🎮</span>
              </div>
              <div className="leading-tight">
                <h1 className="text-base font-display font-bold text-ink tracking-tight">
                  DAILY QUEST
                </h1>
                <p className="text-xs text-ink-soft">
                  LV. <span className="font-bold text-teal-edge">{userLevel}</span>
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-ink">
                  {currentIndex + 1}/{totalQuestions}
                </span>
                <span className="text-ink-soft">{answeredCount} 완료</span>
              </div>
              <div className="tactile-progress h-3">
                <div
                  className="tactile-progress__fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="tactile-chip border-coral bg-coral-tint text-ink">
              <span className="text-base">🔥</span>
              <span className="font-display font-bold text-coral-edge">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
