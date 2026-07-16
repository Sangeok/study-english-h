import { ListChecks, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { playAudio } from "@/shared/lib/play-audio";
import { useToast } from "@/shared/ui";
import { QUIZ_RESULT_ITEM_STYLES, type QuizResultStatus } from "../../config";
import { fillBlank } from "../../lib/fill-blank";
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
  const { toast } = useToast();
  const toggleLabel = getToggleLabel(showDetails);

  async function handlePlaySentence(result: QuizResult): Promise<void> {
    const didStartPlayback = await playAudio(
      fillBlank(result.explanation, result.correctAnswer),
      result.sentenceAudioUrl
    );

    if (!didStartPlayback) {
      toast("이 브라우저에서는 발음 재생을 지원하지 않아요.");
    }
  }

  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="tactile-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="tactile-tile w-12 h-12 bg-ocean border-ocean-edge text-white">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">상세 결과</h3>
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
                    "rounded-2xl p-5 border",
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

                      <div className="flex items-start gap-2">
                        <div className="flex-1 text-sm text-ink-soft leading-relaxed">
                          {item.explanation}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handlePlaySentence(item)}
                          aria-label="문장 발음 듣기"
                          className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-border-warm px-2.5 py-1 text-xs font-bold text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          문장 듣기
                        </button>
                      </div>
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

