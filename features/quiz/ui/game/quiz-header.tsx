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
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🎮</span>
              </div>
              <div className="leading-tight">
                <h1 className="text-base font-black text-white tracking-tight">DAILY QUEST</h1>
                <p className="text-xs text-violet-200">
                  LV. <span className="font-bold text-violet-100">{userLevel}</span>
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-xs text-white/90 mb-1">
                <span className="font-bold">
                  {currentIndex + 1}/{totalQuestions}
                </span>
                <span className="text-white/70">{answeredCount} 완료</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-xl border border-orange-400/30">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-black text-orange-200">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
