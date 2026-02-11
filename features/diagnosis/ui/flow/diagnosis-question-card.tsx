"use client";

import { useState } from "react";
import type { DiagnosisQuestion } from "@/entities/question";
import { getDifficultyStyle } from "@/shared/constants";
import { cn } from "@/lib/utils";
import { TRANSITION_DURATION_MS } from "../../constants";

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
    return "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg scale-[1.02]";
  }
  if (isSelecting) {
    return "border-purple-300 bg-purple-50 scale-[0.98]";
  }
  return "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md hover:scale-[1.01]";
}

function getLabelClassName(isSelected: boolean): string {
  if (isSelected) {
    return "border-purple-600 bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg";
  }
  return "border-purple-300 bg-white group-hover:border-purple-400";
}

export function DiagnosisQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
  isTransitioning,
}: DiagnosisQuestionCardProps) {
  const [selectingOption, setSelectingOption] = useState<string | null>(null);
  const difficultyStyle = getDifficultyStyle(question.difficulty);

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
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-200/30 to-transparent rounded-full -ml-12 -mb-12" />

        <div className="relative z-10">
          {/* 난이도 + 카테고리 배지 */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm",
                difficultyStyle.bg,
                difficultyStyle.text,
                difficultyStyle.border
              )}
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {question.difficulty}
              </span>
            </div>
            <div className="px-4 py-2 bg-purple-100 rounded-full">
              <span className="text-sm font-medium text-purple-700">
                {question.category}
              </span>
            </div>
          </div>

          {/* 한국어 힌트 */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl mb-4">
              <span className="text-sm font-medium text-purple-700">
                한국어 힌트
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-6">
              {question.koreanHint}
            </h3>
          </div>

          {/* 문장 */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 mb-8 border border-purple-100">
            <p className="text-xl md:text-2xl text-purple-900 text-center leading-relaxed font-medium">
              {question.sentence}
            </p>
          </div>

          {/* 선택지 */}
          <div className="space-y-4">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === option.text;
              const isSelecting = selectingOption === option.text;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option.text)}
                  disabled={disabled}
                  className={cn(
                    "group w-full p-5 rounded-2xl border-2 text-left transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    getOptionClassName(isSelected, isSelecting)
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                        getLabelClassName(isSelected)
                      )}
                    >
                      <span
                        className={cn(
                          "font-bold text-lg",
                          isSelected && "text-white",
                          !isSelected &&
                            "text-purple-400 group-hover:text-purple-500"
                        )}
                      >
                        {OPTION_LABELS[idx]}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-lg font-medium transition-colors",
                        isSelected && "text-purple-900",
                        !isSelected &&
                          "text-purple-800 group-hover:text-purple-900"
                      )}
                    >
                      {option.text}
                    </span>

                    {isSelected && (
                      <div className="ml-auto flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-scale-in">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
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
}
