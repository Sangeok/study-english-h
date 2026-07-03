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
import { BASE_XP_PER_QUESTION, calculateQuestionXP } from "../../lib/quiz-xp";
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
  // 현재 보유한 프리 힌트 팩 수량. 서버 스냅샷 기준.
  freeHintCount: number;
  // 이번 세션에서 힌트를 1회 이상 연 문제의 누적 수 (현재 문제 포함).
  hintedCount: number;
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
          <div className="w-1.5 h-1.5 bg-gold rounded-full" />
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
  freeHintCount,
  hintedCount,
}: QuizQuestionProps) {
  const { selectingOption, sparkles, handleSelect } = useOptionSelection(question.id, onAnswer);
  const difficultyStyle = getDifficultyStyle(question.difficulty);
  // 낙관적 미리보기:
  //   힌트를 열었고, 지금까지 힌트를 연 문제 수가 보유 프리 힌트 이하라면
  //   서버의 selectFreeHintTargets 가 이 문제를 프리 힌트 대상으로 잡아 XP 페널티를 상쇄할 것으로 본다.
  //   (단, 사용자의 실제 정답 여부에 따라 서버 최종값은 달라질 수 있다 — 그 경우는 결과 화면이 보정.)
  const isHintUsed = hintLevel > 0;
  const willBeFree = isHintUsed && hintedCount <= freeHintCount;
  const currentXP = willBeFree ? BASE_XP_PER_QUESTION : calculateQuestionXP(true, hintLevel);
  const xpBadgeTitle = willBeFree ? "프리 힌트 적용 예정" : undefined;
  const showHintBlock = hintLevel > 0;
  const showContextHint = shouldShowContextHint(hintLevel, question.contextHint);
  const showKoreanHint = shouldShowKoreanHint(hintLevel, question.contextHint);
  const canRequestMoreHint = canRequestMoreHints(hintLevel, question.contextHint);
  const hintButtonAriaLabel = getHintButtonLabel(hintLevel);

  return (
    <div className="tactile-card tactile-card--raised p-5 relative overflow-hidden">
      <SparkleLayer sparkles={sparkles} />

      <div className="relative z-10">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 ${difficultyStyle.bg} ${difficultyStyle.text} rounded-lg border-2 ${difficultyStyle.border} text-xs font-bold uppercase`}
            >
              <span className="text-sm">{difficultyStyle.icon}</span>
              <span>{question.difficulty}</span>
            </div>
            <div className="px-3 py-1 bg-teal-tint rounded-lg border-2 border-teal text-xs font-bold text-teal-edge">
              {question.category}
            </div>
            <div
              className={cn(
                "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2",
                !willBeFree && "bg-gold-tint border-gold",
                willBeFree && "bg-teal-tint border-teal"
              )}
              title={xpBadgeTitle}
            >
              <span className="text-sm">💎</span>
              <span
                className={cn(
                  "text-xs font-display font-bold",
                  !willBeFree && "text-gold-edge",
                  willBeFree && "text-teal-edge"
                )}
              >
                +{currentXP} XP
              </span>
              {willBeFree && (
                <span className="text-[10px] font-bold text-teal-edge">프리 힌트</span>
              )}
            </div>
          </div>

          {showHintBlock && (
            <div className="mb-4 space-y-2 animate-slide-down" role="region" aria-label="힌트 영역">
              {showContextHint && (
                <div className="bg-gold-tint rounded-xl p-3 border-2 border-gold">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📝</span>
                    <div>
                      <p className="text-xs font-bold text-gold-edge mb-0.5">상황 힌트</p>
                      <p className="text-sm text-ink">{question.contextHint}</p>
                    </div>
                  </div>
                </div>
              )}

              {showKoreanHint && (
                <div className="bg-teal-tint rounded-xl p-3 border-2 border-teal">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🇰🇷</span>
                    <div>
                      <p className="text-xs font-bold text-teal-edge mb-0.5">한국어 힌트</p>
                      <p className="text-base font-bold text-ink">{question.koreanHint}</p>
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
              className="tactile-btn tactile-btn--ghost tactile-btn--block tactile-btn--sm mb-4"
            >
              <HintButtonContent hintLevel={hintLevel} />
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <div className="bg-cream rounded-xl p-4 border-2 border-border-warm">
            <p className="text-base md:text-lg text-ink text-center leading-relaxed font-medium">{question.sentence}</p>
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
                      className="flex-shrink-0 w-6 h-6 bg-teal border-2 border-teal-edge rounded-full flex items-center justify-center"
                      style={{ animation: "checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
