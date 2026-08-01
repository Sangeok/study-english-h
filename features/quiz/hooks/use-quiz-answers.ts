"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyQuizItem, QuizSubmission } from "../types";
import { getMaxHintLevel } from "../lib/quiz-hint-logic";
import { getListeningMaxHintLevel } from "../lib/listening-hint-logic";
import { getTypingMaxHintLevel } from "../lib/typing-hint-logic";
import { useQuizTimer } from "./use-quiz-timer";

const STORAGE_KEY = "quiz-answers-in-progress";

function loadFromStorage(): Record<string, QuizSubmission> {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, QuizSubmission>) : {};
  } catch {
    return {};
  }
}

export function useQuizAnswers(
  questions: DailyQuizItem[],
  currentIndex: number,
  isQuizSubmitted: boolean
) {
  const [answers, setAnswers] = useState<Record<string, QuizSubmission>>(loadFromStorage);
  const [hintLevels, setHintLevels] = useState<Record<string, 0 | 1 | 2>>({});
  // 재생 실패로 강등된 문항. 상태가 아니라 ref 인 것은 렌더에 쓰이지 않고
  //   제출 shape 를 만들 때만 읽히기 때문이다.
  const degradedRef = useRef<Set<string>>(new Set());
  // 타이핑에서 발음을 재생한 문항. XP 에는 영향이 없고 SRS 확신도에만 쓰이므로
  //   렌더에 안 나타난다 — degradedRef 와 같은 이유로 상태가 아니라 ref 다.
  const audioPlayedRef = useRef<Set<string>>(new Set());
  const { startTimer, getElapsedSeconds } = useQuizTimer();

  useEffect(() => {
    if (questions.length > 0 && !isQuizSubmitted) {
      const currentQuestionId = questions[currentIndex]?.id;
      if (currentQuestionId) {
        startTimer(currentQuestionId);
      }
    }
  }, [currentIndex, questions, isQuizSubmitted, startTimer]);

  useEffect(() => {
    if (isQuizSubmitted) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // sessionStorage 사용 불가 환경(시크릿 모드 할당량 초과 등) 무시
    }
  }, [answers, isQuizSubmitted]);

  /**
   * 답안 저장. **`id → vocabularyId` 리맵이 일어나는 유일한 지점이다** — 다른 곳에서 또
   * 매핑하면 두 이름이 코드 전반에 퍼진다.
   *
   * 키는 두 유형 모두 `question.id` 를 그대로 쓴다: 답안·힌트·타이머가 이 키를 공유하므로
   * 리스닝만 다른 키를 쓰면 세 자료구조가 어긋난다. 필드명이 바뀌는 건 제출 body 뿐이다.
   */
  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      const timeSpent = getElapsedSeconds(questionId);
      const hintLevel = hintLevels[questionId] ?? 0;
      const type = questions.find((question) => question.id === questionId)?.type;

      setAnswers((prev) => {
        if (type === "listening") {
          return {
            ...prev,
            [questionId]: {
              type: "listening",
              vocabularyId: questionId,
              selectedMeaning: answer,
              timeSpent,
              hintLevel,
              ...(degradedRef.current.has(questionId) ? { autoDegraded: true as const } : {}),
            },
          };
        }

        if (type === "typing") {
          return {
            ...prev,
            [questionId]: {
              type: "typing",
              vocabularyId: questionId,
              // 정규화하지 않고 친 그대로 보낸다 — 채점 규칙은 서버 한 곳에만 둔다.
              typedAnswer: answer,
              audioPlayed: audioPlayedRef.current.has(questionId),
              timeSpent,
              hintLevel,
            },
          };
        }

        return {
          ...prev,
          [questionId]: {
            type: "reading",
            questionId,
            selectedAnswer: answer,
            timeSpent,
            hintLevel,
          },
        };
      });
    },
    [hintLevels, getElapsedSeconds, questions]
  );

  /**
   * 무인자 호출은 기존 동작(한 단계 상승) 그대로 — `<QuizQuestion onHintRequest>` 는 무수정이다.
   * 재생 실패 시에만 리스닝 컴포넌트가 목표를 명시한다: `handleHintRequest(2)`.
   * 그 강등은 프리 힌트 대상에서 빼야 하므로 따로 표시해 둔다(정렬이 hintLevel 내림차순이라
   * 강등이 사용자가 직접 고른 힌트를 앞지른다).
   */
  const handleHintRequest = useCallback((targetLevel?: 1 | 2) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    if (targetLevel !== undefined) {
      degradedRef.current.add(currentQuestion.id);
    }

    setHintLevels((prev) => {
      const current = prev[currentQuestion.id] ?? 0;
      // 리스닝은 contextHint 가 없어 읽기 사다리를 그대로 쓰면 1단계에서 막힌다 —
      //   접근성 탈출구(철자)·XP ×0.6 경로·힌트 엔드포인트 호출이 전부 죽는다.
      // 유형마다 사다리가 다르다. 읽기는 contextHint 유무로 접히고, 리스닝은 항상 2단계,
      //   타이핑은 예문 빈칸 유무로 접힌다 — 세 규칙을 한 모듈에 섞으면 서로를 오염시킨다.
      let maxLevel: 1 | 2;
      if (currentQuestion.type === "listening") {
        maxLevel = getListeningMaxHintLevel();
      } else if (currentQuestion.type === "typing") {
        maxLevel = getTypingMaxHintLevel(Boolean(currentQuestion.blankedSentence));
      } else {
        maxLevel = getMaxHintLevel(currentQuestion.contextHint);
      }
      const next = targetLevel ?? current + 1;
      return {
        ...prev,
        [currentQuestion.id]: Math.min(next, maxLevel) as 0 | 1 | 2,
      };
    });
  }, [currentIndex, questions]);

  /**
   * 타이핑에서 발음을 들었다고 표시한다.
   *
   * XP 에는 영향이 없다(오디오는 힌트가 아니라 문항의 일부다). SRS 확신도에만 쓴다 —
   * 안 듣고 맞혔으면 뜻→인출→철자를 혼자 해낸 것이고, 듣고 맞혔으면 인출 단계가 빠졌다.
   */
  const markAudioPlayed = useCallback((questionId: string) => {
    audioPlayedRef.current.add(questionId);
  }, []);

  return {
    answers,
    hintLevels,
    handleAnswer,
    handleHintRequest,
    markAudioPlayed,
  };
}
