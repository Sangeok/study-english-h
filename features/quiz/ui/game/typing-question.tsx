"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TypingQuestion as TypingQuestionType } from "@/entities/question";
import {
  canRequestMoreTypingHints,
  getTypingHintButtonLabel,
  shouldShowBlankedSentence,
  shouldShowFirstLetter,
} from "../../lib/typing-hint-logic";

interface TypingQuestionProps {
  question: TypingQuestionType;
  typedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  /** 발음을 들었음을 훅에 알린다 — SRS 확신도에만 쓰인다. */
  onAudioPlay: (questionId: string) => void;
  disabled?: boolean;
  hintLevel: 0 | 1 | 2;
  onHintRequest: () => void;
}

interface SpellingHint {
  firstLetter: string;
  length: number;
}

/**
 * 타이핑 문항 — 한국어 뜻을 보고 영어 철자를 직접 친다.
 *
 * 시각 문법은 quiz-question.tsx·listening-question.tsx 를 따른다(프리미티브는 tactile-*,
 * 다크 표면 위에서는 chamber-* 오버라이드).
 *
 * **발음 버튼은 힌트가 아니라 문항의 일부다.** 뜻이 겹치는 단어가 17.5% 라
 * (goal/target/objective) 발음 없이는 정답을 유일하게 특정할 수 없고, 그러면 엄격 채점이
 * 불공정해진다. 무료·선택 재생이라 아는 단어는 안 듣고 쳐서 산출 과제가 보존된다.
 * XP 감점을 걸면 안 누르고 틀리는 유인이 생겨 그 불공정이 되돌아온다.
 *
 * playAudio 를 경유하지 않는다 — 그 TTS 폴백이 요구하는 text 가 곧 정답 단어다.
 */
export function TypingQuestion({
  question,
  typedAnswer,
  onAnswer,
  onAudioPlay,
  disabled,
  hintLevel,
  onHintRequest,
}: TypingQuestionProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [spelling, setSpelling] = useState<SpellingHint | null>(null);

  const hasBlankedSentence = Boolean(question.blankedSentence);
  const showSentence = shouldShowBlankedSentence(hintLevel, hasBlankedSentence);
  const showFirstLetter = shouldShowFirstLetter(hintLevel, hasBlankedSentence);

  const play = useCallback(async () => {
    const audio = audioRef.current ?? new Audio(question.audioUrl);
    audioRef.current = audio;

    try {
      setIsPlaying(true);
      await audio.play();
      setPlaybackFailed(false);
      // 재생에 성공했을 때만 표시한다 — 실패한 재생은 인출을 돕지 않았다.
      onAudioPlay(question.id);
    } catch {
      // 리스닝과 달리 강등하지 않는다. 여기서 오디오는 변별 보조이고 뜻은 여전히 보인다 —
      //   충돌 단어였다면 힌트 1단계(예문)로 변별할 수 있다.
      setPlaybackFailed(true);
    } finally {
      setIsPlaying(false);
    }
  }, [question.audioUrl, question.id, onAudioPlay]);

  /** 힌트 2단계의 첫 글자·글자 수는 별도 엔드포인트로만 온다 — 응답에 정답이 없기 때문이다. */
  const fetchSpelling = useCallback(async () => {
    if (spelling !== null) return;

    try {
      const response = await fetch("/api/quiz/typing-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId: question.id }),
      });

      if (!response.ok) return;

      const body = (await response.json()) as Partial<SpellingHint>;
      if (typeof body.firstLetter === "string" && typeof body.length === "number") {
        setSpelling({ firstLetter: body.firstLetter, length: body.length });
      }
    } catch {
      // 못 받아도 문항은 계속 풀 수 있다.
    }
  }, [question.id, spelling]);

  const requestHint = useCallback(() => {
    onHintRequest();
    // 다음 단계가 철자 발판이면 미리 받아둔다 — 버튼과 표시 사이의 왕복 지연을 없앤다.
    if (!hasBlankedSentence || hintLevel >= 1) {
      void fetchSpelling();
    }
  }, [onHintRequest, hasBlankedSentence, hintLevel, fetchSpelling]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-chamber-line bg-chamber-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-chamber-line px-3 py-1 text-xs font-bold uppercase text-chamber-soft">
          Typing
        </div>
      </div>

      <p className="mb-4 text-center font-display text-2xl font-bold text-chamber-ink">
        {question.meaning}
      </p>

      <div className="mb-5 flex flex-col items-center gap-2">
        <button
          onClick={play}
          disabled={disabled || isPlaying}
          aria-label="발음 듣기"
          className="tactile-btn tactile-btn--ghost tactile-btn--md border-chamber-line text-chamber-ink hover:border-cobalt-lt"
        >
          {isPlaying ? "재생 중..." : "발음 듣기"}
        </button>
        <p className="text-[11px] text-chamber-soft">
          뜻이 겹치는 단어가 있어요. 헷갈리면 들어보세요 — XP는 깎이지 않아요.
        </p>
        {playbackFailed && (
          <p className="text-xs font-medium text-coral">소리를 재생할 수 없어요.</p>
        )}
      </div>

      {showSentence && question.blankedSentence && (
        <div className="mb-4 rounded-xl border border-chamber-line bg-chamber-panel-hi p-3 animate-slide-down">
          <p className="mb-0.5 text-xs font-bold text-gold">예문</p>
          <p className="text-sm text-chamber-ink">{question.blankedSentence}</p>
        </div>
      )}

      {showFirstLetter && spelling && (
        <div className="mb-4 rounded-xl border border-chamber-line bg-chamber-panel-hi p-3 animate-slide-down">
          <p className="mb-0.5 text-xs font-bold text-cobalt-lt">철자</p>
          <p className="font-display text-lg font-bold tracking-[0.3em] text-chamber-ink">
            {spelling.firstLetter}
            {"_".repeat(Math.max(0, spelling.length - 1))}
          </p>
          <p className="mt-1 text-xs text-chamber-soft">{spelling.length}글자</p>
        </div>
      )}

      {canRequestMoreTypingHints(hintLevel, hasBlankedSentence) && (
        <button
          onClick={requestHint}
          disabled={disabled}
          className="tactile-btn tactile-btn--ghost tactile-btn--block tactile-btn--sm mb-4 border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
        >
          {getTypingHintButtonLabel(hintLevel, hasBlankedSentence)}
        </button>
      )}

      <input
        type="text"
        value={typedAnswer ?? ""}
        onChange={(event) => onAnswer(question.id, event.target.value)}
        disabled={disabled}
        placeholder="영어 철자를 입력하세요"
        aria-label="영어 철자 입력"
        // 자동수정·자동대문자·맞춤법 검사를 전부 끈다. 켜져 있으면 키보드가 borow 를
        //   borrow 로 고쳐버려 엄격 채점이 무의미해지고, 반대로 맞게 친 것을 망치기도 한다.
        autoCorrect="off"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-xl border border-chamber-line bg-chamber-panel-hi px-4 py-3",
          "text-center font-display text-lg tracking-wide text-chamber-ink",
          "placeholder:text-chamber-soft placeholder:font-sans placeholder:text-sm placeholder:tracking-normal",
          "focus:border-cobalt-lt focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-30"
        )}
      />
    </div>
  );
}
