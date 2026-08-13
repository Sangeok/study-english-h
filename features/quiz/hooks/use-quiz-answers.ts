"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyQuizItem, QuizSubmission } from "../types";
import { getMaxHintLevel } from "../lib/quiz-hint-logic";
import { getListeningMaxHintLevel } from "../lib/listening-hint-logic";
import { getTypingMaxHintLevel } from "../lib/typing-hint-logic";
import {
  clearQuizSession,
  saveQuizSession,
  type QuizSessionSnapshot,
} from "../lib/quiz-session-storage";
import { useQuizTimer } from "./use-quiz-timer";

interface UseQuizAnswersArgs {
  questions: DailyQuizItem[];
  currentIndex: number;
  isQuizSubmitted: boolean;
  /** 복원본. 없으면 빈 상태로 시작한다. */
  restored: QuizSessionSnapshot | null;
  // 스냅샷에 함께 저장되는 세션 메타. **객체로 묶지 않고 스칼라로 평탄화한다** —
  //   `meta: {...}` 를 컨테이너에서 인라인으로 만들면 매 렌더 새 참조가 되어,
  //   persistSession 의 deps 에 넣으면 렌더마다 localStorage 쓰기가 일어나고
  //   빼면 react-hooks/exhaustive-deps 가 경고한다. 스칼라는 값 비교라 둘 다 없다.
  listeningEnabled: boolean;
  userLevel: string;
  hasCompletedToday: boolean;
  freeHintCount: number;
}

export function useQuizAnswers({
  questions,
  currentIndex,
  isQuizSubmitted,
  restored,
  listeningEnabled,
  userLevel,
  hasCompletedToday,
  freeHintCount,
}: UseQuizAnswersArgs) {
  const [answers, setAnswers] = useState<Record<string, QuizSubmission>>(
    () => restored?.answers ?? {}
  );
  const [hintLevels, setHintLevels] = useState<Record<string, 0 | 1 | 2>>(
    () => restored?.hintLevels ?? {}
  );
  // 재생 실패로 강등된 문항. 상태가 아니라 ref 인 것은 렌더에 쓰이지 않고
  //   제출 shape 를 만들 때만 읽히기 때문이다.
  const degradedRef = useRef<Set<string>>(new Set(restored?.degradedIds));
  // 타이핑에서 발음을 재생한 문항. XP 에는 영향이 없고 SRS 확신도에만 쓰이므로
  //   렌더에 안 나타난다 — degradedRef 와 같은 이유로 상태가 아니라 ref 다.
  const audioPlayedRef = useRef<Set<string>>(new Set(restored?.audioPlayedIds));
  const { startTimer, getElapsedSeconds } = useQuizTimer();

  useEffect(() => {
    if (questions.length > 0 && !isQuizSubmitted) {
      const currentQuestionId = questions[currentIndex]?.id;
      if (currentQuestionId) {
        startTimer(currentQuestionId);
      }
    }
  }, [currentIndex, questions, isQuizSubmitted, startTimer]);

  /**
   * 진행 중 세션을 통째로 저장한다 — 문항·답안·힌트·인덱스가 한 스냅샷에 함께 들어간다.
   * 답안만 남기면 재진입 시 새로 뽑힌 문항과 키가 어긋나 제출이 막힌다(그 결함의 수정이다).
   *
   * **`hasProgress` 판정을 렌더 스코프로 끌어올리지 말 것.** ref 두 개는 리렌더 없이 바뀌므로,
   * 렌더 시점 값으로 굳히면 markAudioPlayed 경로가 직전 렌더의 false 를 보고 그냥 반환한다 —
   * 발음만 듣고 답 없이 이탈하는 경우가 정확히 그 경로다.
   *
   * 흔적이 없으면 저장하지 않는 이유: 마운트 직후에도 effect 는 한 번 돈다. 그때 저장하면
   * "시작하기"를 누른 것만으로 그날 문항 세트가 고정되어, 한 문제도 풀지 않고 나간 사용자까지
   * 같은 세트에 묶인다. 복원할 진행이 없는데 문항만 고정하는 것은 이 기능의 목표가 아니다.
   */
  const persistSession = useCallback(() => {
    const hasProgress =
      Object.keys(answers).length > 0 ||
      Object.keys(hintLevels).length > 0 ||
      audioPlayedRef.current.size > 0 ||
      degradedRef.current.size > 0;

    if (!hasProgress) return;

    saveQuizSession({
      questions,
      answers,
      hintLevels,
      currentIndex,
      degradedIds: Array.from(degradedRef.current),
      audioPlayedIds: Array.from(audioPlayedRef.current),
      listeningEnabled,
      userLevel,
      hasCompletedToday,
      freeHintCount,
    });
  }, [
    questions,
    answers,
    hintLevels,
    currentIndex,
    listeningEnabled,
    userLevel,
    hasCompletedToday,
    freeHintCount,
  ]);

  useEffect(() => {
    if (isQuizSubmitted) {
      clearQuizSession();
      return;
    }
    persistSession();
  }, [persistSession, isQuizSubmitted]);

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
   *
   * 저장을 직접 부른다: ref 변경은 리렌더도 effect 도 일으키지 않으므로, 여기서 부르지 않으면
   * 발음만 듣고 이탈한 경우 그 사실이 유실되고 복원 후 정답이 easy 로 과대평가된다.
   */
  const markAudioPlayed = useCallback(
    (questionId: string) => {
      audioPlayedRef.current.add(questionId);
      persistSession();
    },
    [persistSession]
  );

  return {
    answers,
    hintLevels,
    handleAnswer,
    handleHintRequest,
    markAudioPlayed,
  };
}
