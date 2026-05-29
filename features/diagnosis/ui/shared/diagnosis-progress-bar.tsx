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

function getProgressDotClassName(idx: number, currentIndex: number): string {
  if (idx < currentIndex) return "bg-teal scale-110";
  if (idx === currentIndex) return "bg-teal-edge scale-150 animate-pulse";
  return "bg-border-warm";
}

export function DiagnosisProgressBar({
  progress,
  timer,
}: DiagnosisProgressBarProps) {
  return (
    <div className="mb-6 animate-slide-down">
      <div className="tactile-card tactile-card--raised p-5 md:p-6">
        <div className="flex items-center justify-between gap-6">
          {/* 진행 상황 */}
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="tactile-tile h-11 w-11 border-teal-edge bg-teal text-white">
                  <span className="font-display text-base font-bold">
                    {progress.currentIndex + 1}
                  </span>
                </div>
                <div className="leading-tight">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-edge">
                    Level Test
                  </p>
                  <h2 className="font-display text-lg font-bold text-ink">
                    레벨 진단
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {progress.answeredCount} / {progress.totalQuestions} 완료
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold leading-none text-ink">
                  {Math.round(progress.percentage)}
                  <span className="text-lg text-ink-soft">%</span>
                </div>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="relative">
              <div className="tactile-progress h-3.5">
                <div
                  className="tactile-progress__fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-1.5">
                {Array.from({ length: progress.totalQuestions }).map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-300",
                      getProgressDotClassName(idx, progress.currentIndex)
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 타이머 */}
          <CircularProgress
            percentage={timer.percentage}
            size="md"
            isWarning={timer.isWarning}
          >
            <div
              className={cn(
                "font-display text-xl font-bold",
                timer.isWarning ? "text-coral-edge" : "text-ink"
              )}
            >
              {timer.minutes}:{timer.seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
              남음
            </div>
          </CircularProgress>
        </div>
      </div>
    </div>
  );
}
