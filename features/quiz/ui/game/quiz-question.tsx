"use client";

import { memo } from "react";
import { Check, Lightbulb, Search } from "lucide-react";
import type { QuizQuestion } from "@/entities/question";
import { cn } from "@/lib/utils";
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
  const Icon = hintLevel === 0 ? Lightbulb : Search;
  return (
    <>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{getHintButtonLabel(hintLevel)}</span>
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
    <div className="relative overflow-hidden rounded-2xl border border-chamber-line bg-chamber-panel p-5">
      <SparkleLayer sparkles={sparkles} />

      <div className="relative z-10">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1 text-xs font-bold uppercase text-chamber-soft">
              {question.difficulty}
            </div>
            <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1 text-xs font-bold text-chamber-soft">
              {question.category}
            </div>
            <div
              className="ml-auto flex items-center gap-1.5 rounded-full border border-chamber-line px-3 py-1"
              title={xpBadgeTitle}
            >
              <span
                className={cn(
                  "text-xs font-display font-bold tabular-nums",
                  !willBeFree && "text-cobalt-lt",
                  willBeFree && "text-meadow"
                )}
              >
                +{currentXP} XP
              </span>
              {willBeFree && (
                <span className="text-[10px] font-bold text-meadow">프리 힌트</span>
              )}
            </div>
          </div>

          {showHintBlock && (
            <div className="mb-4 space-y-2 animate-slide-down" role="region" aria-label="힌트 영역">
              {showContextHint && (
                <div className="rounded-xl border border-chamber-line bg-chamber-panel-hi p-3">
                  <p className="text-xs font-bold text-gold mb-0.5">상황 힌트</p>
                  <p className="text-sm text-chamber-ink">{question.contextHint}</p>
                </div>
              )}

              {showKoreanHint && (
                <div className="rounded-xl border border-chamber-line bg-chamber-panel-hi p-3">
                  <p className="text-xs font-bold text-cobalt-lt mb-0.5">한국어 힌트</p>
                  <p className="text-base font-bold text-chamber-ink">{question.koreanHint}</p>
                </div>
              )}
            </div>
          )}

          {canRequestMoreHint && (
            <button
              onClick={onHintRequest}
              disabled={disabled}
              aria-label={hintButtonAriaLabel}
              className="tactile-btn tactile-btn--ghost tactile-btn--block tactile-btn--sm mb-4 border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
            >
              <HintButtonContent hintLevel={hintLevel} />
            </button>
          )}
        </div>

        <div className="relative mb-5 mt-2">
          <p className="text-center text-lg leading-relaxed font-medium text-chamber-ink md:text-xl">
            {question.sentence}
          </p>
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
                  "group relative w-full px-4 py-3 rounded-xl border text-left transition-all duration-200",
                  optionContainerStyle,
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-200 flex-shrink-0",
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
                      className="flex-shrink-0 w-6 h-6 bg-teal rounded-full flex items-center justify-center"
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
