"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LISTENING_SLOW_PLAYBACK_RATE } from "@/shared/constants";
import type { ListeningQuestion as ListeningQuestionType } from "@/entities/question";
import {
  QUIZ_OPTION_LABEL_STYLES,
  QUIZ_OPTION_STYLES,
  QUIZ_OPTION_TEXT_STYLES,
} from "../../config";
import {
  canRequestMoreListeningHints,
  getListeningHintButtonLabel,
  shouldPlaySlowly,
  shouldShowSpelling,
} from "../../lib/listening-hint-logic";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

interface ListeningQuestionProps {
  question: ListeningQuestionType;
  selectedMeaning?: string;
  onAnswer: (questionId: string, answer: string) => void;
  disabled?: boolean;
  hintLevel: 0 | 1 | 2;
  /** 무인자면 한 단계 상승, 인자를 주면 그 레벨로 간다(재생 실패 시 2). */
  onHintRequest: (targetLevel?: 1 | 2) => void;
}

/**
 * 리스닝 문항 — 단어 오디오를 듣고 한국어 뜻을 고른다.
 *
 * 시각 문법은 quiz-question.tsx 를 따른다(챔버 토큰) — 같은 자리에 교체 렌더되므로
 * 두 문항이 다른 화면처럼 보이면 안 된다. 이 리포에는 폐기된 tactile 축이 아직 남아 있어
 * "주변을 보고 따라 하라"가 성립하지 않는다(ADR 0001).
 *
 * **playAudio 를 경유하지 않는다.** 그 함수는 URL 이 없을 때와 재생이 실패했을 때 모두
 * speakWithBrowserTts(text) 로 넘어가는데, 그 text 가 곧 정답 단어다 — 클라이언트에 없고
 * 있어서도 안 된다. 빈 문자열을 넘기면 speechSynthesis 가 아무 말 없이 성공해 true 를
 * 돌려주므로 **실패가 성공으로 위장된다.**
 */
export function ListeningQuestion({
  question,
  selectedMeaning,
  onAnswer,
  disabled,
  hintLevel,
  onHintRequest,
}: ListeningQuestionProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spelling, setSpelling] = useState<string | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  const showSpelling = shouldShowSpelling(hintLevel);

  /** 힌트 2단계의 철자는 별도 엔드포인트로만 온다 — 데일리 응답에 실리지 않는다. */
  const revealSpelling = useCallback(async () => {
    if (spelling !== null) return;

    try {
      const response = await fetch("/api/quiz/listening-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId: question.id }),
      });

      if (!response.ok) return;

      const body = (await response.json()) as { word?: string };
      if (typeof body.word === "string") {
        setSpelling(body.word);
      }
    } catch {
      // 철자를 못 받아도 문항은 계속 풀 수 있다 — 오디오가 이미 재생됐거나 강등 중이다.
    }
  }, [question.id, spelling]);

  const play = useCallback(async () => {
    const audio = audioRef.current ?? new Audio(question.audioUrl);
    audioRef.current = audio;
    audio.playbackRate = shouldPlaySlowly(hintLevel) ? LISTENING_SLOW_PLAYBACK_RATE : 1;

    try {
      setIsPlaying(true);
      await audio.play();
      setPlaybackFailed(false);
    } catch {
      // 재생 실패 = 접근성 탈출구가 필요한 순간. TTS 폴백은 쓸 수 없으므로
      //   힌트 2단계(철자)로 자동 강등한다. XP 는 2단계 규칙(×0.6)을 그대로 따르되,
      //   사용자가 요청한 힌트가 아니므로 프리 힌트 대상에서는 빠진다(훅이 표시해 둔다).
      setPlaybackFailed(true);
      onHintRequest(2);
      void revealSpelling();
    } finally {
      setIsPlaying(false);
    }
  }, [question.audioUrl, hintLevel, onHintRequest, revealSpelling]);

  const requestHint = useCallback(() => {
    onHintRequest();
    // 다음 레벨이 2면 철자를 미리 받아둔다 — 버튼을 누른 직후 보여야 한다.
    if (hintLevel >= 1) {
      void revealSpelling();
    }
  }, [onHintRequest, hintLevel, revealSpelling]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-chamber-line bg-chamber-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1 text-xs font-bold uppercase text-chamber-soft">
          Listening
        </div>
        {shouldPlaySlowly(hintLevel) && (
          <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1 text-xs font-bold text-cobalt-lt">
            느린 재생
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col items-center gap-3">
        <button
          onClick={play}
          disabled={disabled || isPlaying}
          aria-label="단어 발음 듣기"
          className="tactile-btn tactile-btn--ghost tactile-btn--lg border-chamber-line text-chamber-ink hover:border-cobalt-lt"
        >
          {isPlaying ? "재생 중..." : "발음 듣기"}
        </button>

        {playbackFailed && (
          <p className="text-xs font-medium text-coral">
            소리를 재생할 수 없어 철자를 열었어요.
          </p>
        )}

        {showSpelling && spelling && (
          <p className="font-display text-2xl font-bold tracking-wide text-chamber-ink">
            {spelling}
          </p>
        )}
      </div>

      {canRequestMoreListeningHints(hintLevel) && (
        <button
          onClick={requestHint}
          disabled={disabled}
          className="tactile-btn tactile-btn--ghost tactile-btn--block tactile-btn--sm mb-4 border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
        >
          {getListeningHintButtonLabel(hintLevel)}
        </button>
      )}

      <div className="space-y-2.5">
        {question.options.map((option, index) => {
          const isSelected = selectedMeaning === option.text;

          return (
            <button
              key={option.text}
              onClick={() => onAnswer(question.id, option.text)}
              disabled={disabled}
              className={cn(
                "group relative w-full rounded-xl border px-4 py-3 text-left transition-all duration-200",
                isSelected ? QUIZ_OPTION_STYLES.selected : QUIZ_OPTION_STYLES.default,
                "disabled:cursor-not-allowed disabled:opacity-30"
              )}
            >
              <div className="relative flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black transition-all duration-200",
                    isSelected
                      ? QUIZ_OPTION_LABEL_STYLES.selected
                      : QUIZ_OPTION_LABEL_STYLES.default
                  )}
                >
                  {OPTION_LABELS[index]}
                </div>
                <span
                  className={cn(
                    "flex-1 text-sm font-medium leading-snug transition-colors md:text-base",
                    isSelected
                      ? QUIZ_OPTION_TEXT_STYLES.selected
                      : QUIZ_OPTION_TEXT_STYLES.default
                  )}
                >
                  {option.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
