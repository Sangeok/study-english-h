"use client";

import { memo, useState } from "react";
import { Check } from "lucide-react";
import type { DiagnosisQuestion } from "@/entities/question";
import { cn } from "@/lib/utils";
import { TRANSITION_DURATION_MS } from "../../config";

interface DiagnosisQuestionCardProps {
  question: DiagnosisQuestion;
  selectedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  disabled?: boolean;
  isTransitioning: boolean;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

function getOptionClassName(isSelected: boolean, isSelecting: boolean): string {
  if (isSelected) {
    return "border-cobalt-lt bg-chamber-panel-hi scale-[1.01]";
  }
  if (isSelecting) {
    return "border-cobalt-lt bg-chamber-panel-hi scale-[0.98]";
  }
  return "border-chamber-line bg-chamber-panel hover:border-cobalt-lt";
}

function getLabelClassName(isSelected: boolean): string {
  if (isSelected) {
    return "bg-teal text-white";
  }
  return "bg-chamber-panel-hi text-chamber-soft group-hover:text-cobalt-lt";
}

export const DiagnosisQuestionCard = memo(function DiagnosisQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
  isTransitioning,
}: DiagnosisQuestionCardProps) {
  const [selectingOption, setSelectingOption] = useState<string | null>(null);

  const handleSelect = (optionText: string) => {
    setSelectingOption(optionText);
    setTimeout(() => {
      onAnswer(question.id, optionText);
      setSelectingOption(null);
    }, TRANSITION_DURATION_MS);
  };

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isTransitioning && "opacity-0 translate-y-4",
        !isTransitioning && "opacity-100 translate-y-0"
      )}
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-chamber-line bg-chamber-panel p-6 md:p-9">
        <div className="relative z-10">
          {/* 난이도 + 카테고리 배지 */}
          <div className="mb-6 flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1">
              <span className="font-display text-xs font-bold uppercase tracking-wide text-chamber-soft">
                {question.difficulty}
              </span>
            </div>
            <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1">
              <span className="text-xs font-bold text-chamber-soft">
                {question.category}
              </span>
            </div>
          </div>

          {/* 문장 — hero prompt. 빈칸에 들어갈 단어를 문맥으로 추론한다 (뜻 힌트 없음) */}
          <div className="mb-8 mt-2 text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-chamber-soft">
              Complete the sentence
            </p>
            <h3 className="mt-4 font-display text-2xl font-bold leading-snug text-chamber-ink md:text-3xl">
              {question.sentence}
            </h3>
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === option.text;
              const isSelecting = selectingOption === option.text;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option.text)}
                  disabled={disabled}
                  className={cn(
                    "group w-full rounded-2xl border p-4 text-left transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    getOptionClassName(isSelected, isSelecting)
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold transition-all duration-200",
                        getLabelClassName(isSelected)
                      )}
                    >
                      {OPTION_LABELS[idx]}
                    </div>

                    <span
                      className={cn(
                        "flex-1 text-base font-medium transition-colors md:text-lg",
                        isSelected ? "text-white" : "text-chamber-ink/90"
                      )}
                    >
                      {option.text}
                    </span>

                    {isSelected && (
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal"
                        style={{
                          animation:
                            "checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                        }}
                      >
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
