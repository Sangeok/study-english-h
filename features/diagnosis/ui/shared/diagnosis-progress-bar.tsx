import { cn } from "@/lib/utils";
import { CircularProgress } from "./circular-progress";

interface QuizProgress {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  percentage: number;
}

interface TimerState {
  minutes: number;
  seconds: number;
  percentage: number;
  isWarning: boolean;
}

interface DiagnosisProgressBarProps {
  progress: QuizProgress;
  timer: TimerState;
}

function getProgressDotClassName(
  idx: number,
  currentIndex: number
): string {
  if (idx < currentIndex) return "bg-white scale-125";
  if (idx === currentIndex) return "bg-white/70 scale-150 animate-pulse";
  return "bg-purple-200/50";
}

export function DiagnosisProgressBar({
  progress,
  timer,
}: DiagnosisProgressBarProps) {
  return (
    <div className="mb-8 animate-slide-down">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-purple-100">
        <div className="flex items-center justify-between gap-6">
          {/* 진행 상황 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {progress.currentIndex + 1}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-purple-950">
                    레벨 진단
                  </h2>
                  <p className="text-xs text-purple-700">
                    {progress.answeredCount} / {progress.totalQuestions} 완료
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-900">
                  {Math.round(progress.percentage)}%
                </div>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="relative h-3 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {Array.from({ length: progress.totalQuestions }).map(
                  (_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        getProgressDotClassName(idx, progress.currentIndex)
                      )}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* 타이머 */}
          <CircularProgress
            percentage={timer.percentage}
            size="md"
            isWarning={timer.isWarning}
          >
            <div className="text-xl font-bold text-purple-900">
              {timer.minutes}:{timer.seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-purple-600">남음</div>
          </CircularProgress>
        </div>
      </div>
    </div>
  );
}
