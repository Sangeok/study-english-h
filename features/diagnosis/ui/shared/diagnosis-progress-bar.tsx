import { cn } from "@/lib/utils";
import { CircularProgress } from "./circular-progress";

interface QuizProgress {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  percentage: number;
  // index별 응답 여부 — 점 색으로 미응답 문항을 드러낸다.
  answeredFlags: boolean[];
  // 이동 가능한 마지막 index — 그 뒤 문항은 잠근다(순서대로 답해야 진행).
  maxReachableIndex: number;
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
  onJump?: (index: number) => void;
}

function getProgressDotClassName(isAnswered: boolean, isCurrent: boolean): string {
  if (isCurrent) return "bg-white scale-150 animate-pulse";
  if (isAnswered) return "bg-cobalt-lt scale-110";
  return "bg-[#2a3b5c]";
}

function getProgressDotLabel(
  index: number,
  isAnswered: boolean,
  isLocked: boolean
): string {
  const position = `${index + 1}번 문항`;
  if (isLocked) return `${position} · 앞 문항에 답해야 이동할 수 있어요`;
  return `${position}${isAnswered ? " · 응답함" : " · 미응답"}으로 이동`;
}

export function DiagnosisProgressBar({
  progress,
  timer,
  onJump,
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
                {Array.from({ length: progress.totalQuestions }).map((_, idx) => {
                  const isCurrent = idx === progress.currentIndex;
                  const isAnswered = progress.answeredFlags[idx] ?? false;
                  const isLocked = idx > progress.maxReachableIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onJump?.(idx)}
                      disabled={isLocked}
                      aria-label={getProgressDotLabel(idx, isAnswered, isLocked)}
                      aria-current={isCurrent ? "step" : undefined}
                      // -m-1.5 p-1.5: 레이아웃은 그대로 두고 클릭 영역만 넓힌다.
                      className="pointer-events-auto -m-1.5 grid place-items-center p-1.5 disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all duration-300",
                          getProgressDotClassName(isAnswered, isCurrent)
                        )}
                      />
                    </button>
                  );
                })}
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
