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
  if (idx < currentIndex) return "bg-cobalt-lt scale-110";
  if (idx === currentIndex) return "bg-white scale-150 animate-pulse";
  return "bg-[#2a3b5c]";
}

export function DiagnosisProgressBar({
  progress,
  timer,
}: DiagnosisProgressBarProps) {
  return (
    <div className="mb-6 animate-slide-down">
      <div className="rounded-2xl border border-chamber-line bg-chamber-panel p-5 md:p-6">
        <div className="flex items-center justify-between gap-6">
          {/* 진행 상황 */}
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chamber-panel-hi text-cobalt-lt">
                  <span className="font-display text-base font-bold">
                    {progress.currentIndex + 1}
                  </span>
                </div>
                <div className="leading-tight">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-cobalt-lt">
                    Level Test
                  </p>
                  <h2 className="font-display text-lg font-bold text-chamber-ink">
                    레벨 진단
                  </h2>
                  <p className="text-xs text-chamber-soft">
                    {progress.answeredCount} / {progress.totalQuestions} 완료
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold leading-none text-chamber-ink">
                  {Math.round(progress.percentage)}
                  <span className="text-lg text-chamber-soft">%</span>
                </div>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="relative">
              <div className="tactile-progress h-3.5 bg-[#1b2a44]">
                <div
                  className="tactile-progress__fill bg-cobalt-lt"
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
            strokeColor="var(--cobalt-lt)"
            trackColor="var(--chamber-line)"
          >
            <div
              className={cn(
                "font-display text-xl font-bold tabular-nums",
                timer.isWarning ? "text-coral" : "text-chamber-ink"
              )}
            >
              {timer.minutes}:{timer.seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-chamber-soft">
              남음
            </div>
          </CircularProgress>
        </div>
      </div>
    </div>
  );
}
