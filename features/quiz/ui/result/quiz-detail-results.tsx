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
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-purple-950">상세 결과</h3>
              <p className="text-sm text-purple-700">문제별 정답 확인</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-xl text-purple-900 font-medium transition-colors"
          >
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
                    "bg-gradient-to-br rounded-2xl p-5 border hover:shadow-lg transition-all duration-300",
                    styles.background,
                    styles.border
                  )}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                        styles.iconBackground
                      )}
                    >
                      <span className="text-white font-bold text-lg">{idx + 1}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-950">문제 {idx + 1}</span>
                        <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full", styles.badge)}>
                          <span className="text-lg">{styles.mark}</span>
                          <span className="text-sm font-semibold">{styles.label}</span>
                        </div>
                      </div>

                      {!item.isCorrect && item.correctAnswer && (
                        <div className="mb-2 p-3 bg-white/50 rounded-xl">
                          <span className="text-sm font-semibold text-purple-900">정답: </span>
                          <span className="text-sm text-purple-800">{item.correctAnswer}</span>
                        </div>
                      )}

                      <div className="text-sm text-purple-700 leading-relaxed">{item.explanation}</div>
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

