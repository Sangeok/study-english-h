"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/entities/question";
import { calculateQuestionXP } from "../../lib/quiz-xp";
import { getDifficultyStyle } from "@/shared/constants";

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  disabled?: boolean;
  hintLevel: 0 | 1 | 2;
  onHintRequest: () => void;
}

export function QuizQuestion({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
  hintLevel,
  onHintRequest,
}: QuizQuestionProps) {
  const [selectingOption, setSelectingOption] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState<{ x: number; y: number; id: number }[]>([]);
  const difficultyStyle = getDifficultyStyle(question.difficulty);
  const currentXP = calculateQuestionXP(true, hintLevel);

  const handleSelect = (optionText: string) => {
    setSelectingOption(optionText);

    const newSparkles = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      id: Date.now() + i,
    }));
    setSparkles(newSparkles);

    setTimeout(() => {
      onAnswer(question.id, optionText);
      setSelectingOption(null);
    }, 250);

    setTimeout(() => setSparkles([]), 1000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border border-white/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

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

          {hintLevel > 0 && (
            <div className="mb-4 space-y-2 animate-slide-down" role="region" aria-label="힌트 영역">
              {hintLevel >= 1 && question.contextHint && (
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

              {(hintLevel >= 2 || (hintLevel >= 1 && !question.contextHint)) && (
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

          {((question.contextHint && hintLevel < 2) || (!question.contextHint && hintLevel < 1)) && (
            <button
              onClick={onHintRequest}
              disabled={disabled}
              aria-label={hintLevel === 0 ? "힌트 보기" : "전체 힌트 보기"}
              className="w-full mb-4 py-2.5 px-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hintLevel === 0 ? (
                <>
                  <span className="text-sm">💡</span>
                  <span className="text-sm font-semibold">힌트 보기</span>
                </>
              ) : (
                <>
                  <span className="text-sm">🔍</span>
                  <span className="text-sm font-semibold">전체 힌트 보기</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <p className="text-base md:text-lg text-white/95 text-center leading-relaxed font-medium">
              {question.sentence}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.text;
            const isSelecting = selectingOption === option.text;
            const optionLabels = ["A", "B", "C", "D"];

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option.text)}
                disabled={disabled}
                className={`group relative w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-violet-400 bg-gradient-to-r from-violet-500/30 to-indigo-500/30 shadow-xl shadow-violet-500/20 scale-[1.02]"
                    : isSelecting
                    ? "border-violet-300 bg-violet-400/20 scale-[0.98]"
                    : "border-white/20 hover:border-violet-400/50 hover:bg-white/10 hover:shadow-lg"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="relative flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all duration-200 flex-shrink-0 ${
                      isSelected
                        ? "border-violet-400 bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg"
                        : "border-white/30 bg-white/10 text-white/60 group-hover:border-violet-400/50 group-hover:text-white/80"
                    }`}
                  >
                    {optionLabels[idx]}
                  </div>

                  <span
                    className={`flex-1 text-sm md:text-base font-medium transition-colors leading-snug ${
                      isSelected ? "text-white font-semibold" : "text-white/80 group-hover:text-white"
                    }`}
                  >
                    {option.text}
                  </span>

                  {isSelected && (
                    <div
                      className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                      style={{ animation: "checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
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

      <style jsx>{`
        @keyframes sparkle {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            transform: translate(20px, -20px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(40px, -40px) scale(0);
            opacity: 0;
          }
        }

        @keyframes checkPop {
          0% {
            transform: scale(0) rotate(-90deg);
          }
          50% {
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
