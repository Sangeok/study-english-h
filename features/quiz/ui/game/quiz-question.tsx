"use client";

import { memo } from "react";
import { Check, Lightbulb, Search } from "lucide-react";
import type { QuizQuestion } from "@/entities/question";
import { cn } from "@/lib/utils";
import { getDifficultyStyle } from "@/shared/constants";
import {
  QUIZ_OPTION_LABEL_STYLES,
  QUIZ_OPTION_STYLES,
  QUIZ_OPTION_TEXT_STYLES,
} from "../../config/quiz-option-styles";
import { calculateQuestionXP } from "../../lib/quiz-xp";
import {
  canRequestMoreHints,
  getHintButtonLabel,
  shouldShowContextHint,
  shouldShowKoreanHint,
} from "../../lib/quiz-hint-logic";
import { useOptionSelection } from "../../hooks/use-option-selection";

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  disabled?: boolean;
  hintLevel: 0 | 1 | 2;
  onHintRequest: () => void;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

interface SparkleLayerProps {
  sparkles: Sparkle[];
}

const SparkleLayer = memo(function SparkleLayer({ sparkles }: SparkleLayerProps) {
  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animation: "sparkle 0.6s ease-out forwards",
          }}
        >
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        </div>
      ))}
    </>
  );
});

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function HintButtonContent({ hintLevel }: { hintLevel: 0 | 1 | 2 }) {
  if (hintLevel === 0) {
    return (
      <>
        <Lightbulb className="h-4 w-4" />
        <span className="text-sm font-semibold">힌트 보기</span>
      </>
    );
  }

  return (
    <>
      <Search className="h-4 w-4" />
      <span className="text-sm font-semibold">전체 힌트 보기</span>
    </>
  );
}

export function QuizQuestion({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
  hintLevel,
  onHintRequest,
}: QuizQuestionProps) {
  const { selectingOption, sparkles, handleSelect } = useOptionSelection(question.id, onAnswer);
  const difficultyStyle = getDifficultyStyle(question.difficulty);
  const currentXP = calculateQuestionXP(true, hintLevel);
  const showHintBlock = hintLevel > 0;
  const showContextHint = shouldShowContextHint(hintLevel, question.contextHint);
  const showKoreanHint = shouldShowKoreanHint(hintLevel, question.contextHint);
  const canRequestMoreHint = canRequestMoreHints(hintLevel, question.contextHint);
  const hintButtonAriaLabel = getHintButtonLabel(hintLevel);

  return (
    <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-white/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

      <SparkleLayer sparkles={sparkles} />

      <div className="relative z-10">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 ${difficultyStyle.bg} ${difficultyStyle.text} rounded-lg border ${difficultyStyle.border} text-xs font-bold uppercase`}
            >
              <span className="text-sm">{difficultyStyle.icon}</span>
              <span>{question.difficulty}</span>
            </div>
            <div className="px-3 py-1 bg-violet-100/50 rounded-lg border border-violet-200 text-xs font-semibold text-violet-700">
              {question.category}
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 rounded-lg border border-amber-400/30">
              <span className="text-sm">💎</span>
              <span className="text-xs font-black text-amber-100">+{currentXP} XP</span>
            </div>
          </div>

          {showHintBlock && (
            <div className="mb-4 space-y-2 animate-slide-down" role="region" aria-label="힌트 영역">
              {showContextHint && (
                <div className="bg-amber-400/20 rounded-xl p-3 border border-amber-400/30">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📝</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-200 mb-0.5">상황 힌트</p>
                      <p className="text-sm text-white/90">{question.contextHint}</p>
                    </div>
                  </div>
                </div>
              )}

              {showKoreanHint && (
                <div className="bg-violet-400/20 rounded-xl p-3 border border-violet-400/30">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🇰🇷</span>
                    <div>
                      <p className="text-xs font-semibold text-violet-200 mb-0.5">한국어 힌트</p>
                      <p className="text-base font-bold text-white">{question.koreanHint}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {canRequestMoreHint && (
            <button
              onClick={onHintRequest}
              disabled={disabled}
              aria-label={hintButtonAriaLabel}
              className="w-full mb-4 py-2.5 px-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HintButtonContent hintLevel={hintLevel} />
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <p className="text-base md:text-lg text-white/95 text-center leading-relaxed font-medium">{question.sentence}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.text;
            const isSelecting = selectingOption === option.text;

            let optionContainerStyle: string = QUIZ_OPTION_STYLES.default;
            if (isSelected) {
              optionContainerStyle = QUIZ_OPTION_STYLES.selected;
            } else if (isSelecting) {
              optionContainerStyle = QUIZ_OPTION_STYLES.selecting;
            }

            const optionLabelStyle: string = isSelected
              ? QUIZ_OPTION_LABEL_STYLES.selected
              : QUIZ_OPTION_LABEL_STYLES.default;
            const optionTextStyle: string = isSelected ? QUIZ_OPTION_TEXT_STYLES.selected : QUIZ_OPTION_TEXT_STYLES.default;

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option.text)}
                disabled={disabled}
                className={cn(
                  "group relative w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200",
                  optionContainerStyle,
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all duration-200 flex-shrink-0",
                      optionLabelStyle
                    )}
                  >
                    {OPTION_LABELS[idx]}
                  </div>

                  <span className={cn("flex-1 text-sm md:text-base font-medium transition-colors leading-snug", optionTextStyle)}>
                    {option.text}
                  </span>

                  {isSelected && (
                    <div
                      className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                      style={{ animation: "checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
