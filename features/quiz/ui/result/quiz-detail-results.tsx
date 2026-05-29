import { cn } from "@/lib/utils";
import { QUIZ_RESULT_ITEM_STYLES, type QuizResultStatus } from "../../config";
import type { QuizResult } from "../../types";

interface QuizDetailResultsProps {
  results: QuizResult[];
  showDetails: boolean;
  onToggle: () => void;
}

function getResultStatus(isCorrect: boolean): QuizResultStatus {
  if (isCorrect) {
    return "correct";
  }

  return "incorrect";
}

function getToggleLabel(showDetails: boolean): string {
  if (showDetails) {
    return "숨기기";
  }

  return "보기";
}

export function QuizDetailResults({ results, showDetails, onToggle }: QuizDetailResultsProps) {
  const toggleLabel = getToggleLabel(showDetails);

  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="tactile-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="tactile-tile w-12 h-12 bg-ocean border-ocean-edge text-2xl">
              <span>📊</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-ink">상세 결과</h3>
              <p className="text-sm text-ink-soft">문제별 정답 확인</p>
            </div>
          </div>
          <button onClick={onToggle} className="tactile-btn tactile-btn--ghost tactile-btn--sm">
            {toggleLabel}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-3 animate-quiz-expand">
            {results.map((item, idx) => {
              const status = getResultStatus(item.isCorrect);
              const styles = QUIZ_RESULT_ITEM_STYLES[status];

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl p-5 border-2 transition-transform duration-200 hover:-translate-y-0.5",
                    styles.background,
                    styles.border
                  )}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                        styles.iconBackground
                      )}
                    >
                      <span className="text-white font-display font-bold text-lg">{idx + 1}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-ink">문제 {idx + 1}</span>
                        <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full", styles.badge)}>
                          <span className="text-lg">{styles.mark}</span>
                          <span className="text-sm font-semibold">{styles.label}</span>
                        </div>
                      </div>

                      {!item.isCorrect && item.correctAnswer && (
                        <div className="mb-2 p-3 bg-paper/70 rounded-xl border border-border-warm">
                          <span className="text-sm font-bold text-ink">정답: </span>
                          <span className="text-sm text-ink">{item.correctAnswer}</span>
                        </div>
                      )}

                      <div className="text-sm text-ink-soft leading-relaxed">{item.explanation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

