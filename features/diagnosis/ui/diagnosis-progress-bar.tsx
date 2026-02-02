interface DiagnosisProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  progress: number;
  minutes: number;
  seconds: number;
  timePercentage: number;
  isTimeWarning: boolean;
}

export function DiagnosisProgressBar({
  currentIndex,
  totalQuestions,
  answeredCount,
  progress,
  minutes,
  seconds,
  timePercentage,
  isTimeWarning,
}: DiagnosisProgressBarProps) {
  return (
    <div className="mb-8 animate-slide-down">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-purple-100">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">{currentIndex + 1}</span>
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-purple-950">레벨 진단</h2>
                  <p className="text-xs text-purple-700">
                    {answeredCount} / {totalQuestions} 완료
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-900">{Math.round(progress)}%</div>
              </div>
            </div>

            <div className="relative h-3 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx < currentIndex
                        ? "bg-white scale-125"
                        : idx === currentIndex
                        ? "bg-white/70 scale-150 animate-pulse"
                        : "bg-purple-200/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e9d5ff"
                strokeWidth="8"
                className="opacity-30"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isTimeWarning ? "#ef4444" : "#8b5cf6"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${264 * (timePercentage / 100)} 264`}
                className={`transition-all duration-1000 ${isTimeWarning ? "animate-pulse" : ""}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-purple-900">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-purple-600">남음</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
