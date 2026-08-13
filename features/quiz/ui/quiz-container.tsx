"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { ROUTES } from "@/shared/constants";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { submitQuiz } from "../api/quiz-api";
import {
  toDailyQuizResponse,
  type QuizSessionSnapshot,
} from "../lib/quiz-session-storage";
import type { QuizSubmission } from "../types";
import { QuizQuestion } from "./game/quiz-question";
import { ListeningQuestion } from "./game/listening-question";
import { TypingQuestion } from "./game/typing-question";
import { QuizFeedback } from "./result/quiz-feedback";
import { QuizHeader } from "./game/quiz-header";
import { QuizNavigation } from "./game/quiz-navigation";
import { QuizEmpty } from "./status/quiz-empty";
import { useRewardToast } from "@/features/gamification";
import { useDailyQuiz } from "../hooks/use-daily-quiz";
import { useQuizAnswers } from "../hooks/use-quiz-answers";
import { useQuizNavigation } from "../hooks/use-quiz-navigation";
import { useQuizState } from "../hooks/use-quiz-state";

/**
 * 답안 맵의 값이 판별 유니온이라 좁히기 전에는 `.selectedAnswer` 를 읽을 수 없다.
 * 읽기 분기에서만 쓰이므로 리스닝 답안은 undefined 로 떨어뜨린다.
 */
function readAnswerOf(answer: QuizSubmission | undefined): string | undefined {
  if (!answer || answer.type === "listening" || answer.type === "typing") {
    return undefined;
  }

  return answer.selectedAnswer;
}

/** 타이핑 분기의 대응물 — 사용자가 친 문자열. */
function readTypedOf(answer: QuizSubmission | undefined): string | undefined {
  if (answer?.type !== "typing") {
    return undefined;
  }

  return answer.typedAnswer;
}

/** 리스닝 분기의 대응물 — 선택된 한국어 뜻. */
function readMeaningOf(answer: QuizSubmission | undefined): string | undefined {
  if (answer?.type !== "listening") {
    return undefined;
  }

  return answer.selectedMeaning;
}

interface QuizContainerProps {
  /** 게이트가 소유한다 — 컨테이너가 스스로 localStorage 를 읽으면 안 된다.
   *  첫 훅이 이미 서스펜드라 읽을 시점이 없고, 서버/클라이언트 값이 갈리면 쿼리 키가 어긋난다. */
  listeningEnabled: boolean;
  /** 진행 중이던 세션. 게이트가 "시작하기" 시점에 한 번 읽어 넘긴다. */
  restoredSession: QuizSessionSnapshot | null;
}

export function QuizContainer({ listeningEnabled, restoredSession }: QuizContainerProps) {
  const router = useRouter();
  // 렌더마다 새 객체를 만들지 않는다 — react-query 는 캐시가 빌 때만 initialData 를 읽으므로
  //   기능상 무해하지만, restoredSession 이 불변인데 매번 새로 만들 이유가 없다.
  const initialQuiz = useMemo(
    () => (restoredSession ? toDailyQuizResponse(restoredSession) : undefined),
    [restoredSession]
  );
  const { questions, userLevel, hasCompletedToday, freeHintCount } = useDailyQuiz(
    listeningEnabled,
    initialQuiz
  );
  const answersRef = useRef<Record<string, QuizSubmission>>({});
  const queryClient = useQueryClient();
  const { showRewards } = useRewardToast();

  const submitMutation = useMutation({
    mutationFn: submitQuiz,
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: queryKeys.quiz.daily(listeningEnabled) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.stats() });
      if (data.gamification && !data.isExtraPractice) {
        showRewards(data.gamification);
      }
    },
    onError: (error) => {
      console.error("Quiz submit error:", error);
    },
  });

  const handleSubmit = useCallback(() => {
    const answerList = Object.values(answersRef.current);
    submitMutation.mutate(answerList);
  }, [submitMutation]);


  const { currentIndex, isTransitioning, goNext, goPrevious } = useQuizNavigation(
    questions.length,
    handleSubmit,
    restoredSession?.currentIndex ?? 0
  );
  const { answers, hintLevels, handleAnswer, handleHintRequest, markAudioPlayed } = useQuizAnswers({
    questions,
    currentIndex,
    isQuizSubmitted: submitMutation.isSuccess,
    restored: restoredSession,
    listeningEnabled,
    userLevel,
    hasCompletedToday,
    freeHintCount,
  });
  const { currentQuestion, currentHintLevel, answeredCount, isLastQuestion, isAnswered, canSubmit } =
    useQuizState(questions, currentIndex, answers, hintLevels);

  // 현재 세션에서 힌트를 1회 이상 연 문제의 수.
  // 서버의 selectFreeHintTargets는 정답 여부까지 고려하지만 클라이언트는 정답을 모르므로,
  // "힌트 사용한 문제 수 ≤ freeHintCount" 일 때 이 힌트는 프리 힌트로 상쇄된다고 낙관적으로 본다.
  const hintedCount = Object.values(hintLevels).filter((level) => level > 0).length;

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  if (!currentQuestion) {
    return <QuizEmpty onGoMain={() => router.push(ROUTES.HOME)} />;
  }

  if (submitMutation.isSuccess && submitMutation.data) {
    return <QuizFeedback result={submitMutation.data} />;
  }

  return (
    <div className="h-screen bg-chamber overflow-hidden flex flex-col">
      {hasCompletedToday && (
        <div className="relative z-10 px-4 pt-2">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-chamber-line bg-chamber-panel">
              <span className="text-chamber-soft">
                추가 연습 모드 — 오늘 퀴즈는 이미 완료했어요. XP는 적립되지 않아요.
              </span>
            </div>
          </div>
        </div>
      )}

      <QuizHeader
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        userLevel={userLevel}
      />

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div
            className={cn(
              "transition-all duration-300 opacity-100 scale-100",
              isTransitioning && "opacity-0 scale-95"
            )}
          >
            {currentQuestion.type === "typing" ? (
              <TypingQuestion
                question={currentQuestion}
                typedAnswer={readTypedOf(answers[currentQuestion.id])}
                onAnswer={handleAnswer}
                onAudioPlay={markAudioPlayed}
                disabled={submitMutation.isPending}
                hintLevel={currentHintLevel}
                onHintRequest={handleHintRequest}
              />
            ) : currentQuestion.type === "listening" ? (
              <ListeningQuestion
                question={currentQuestion}
                selectedMeaning={readMeaningOf(answers[currentQuestion.id])}
                onAnswer={handleAnswer}
                disabled={submitMutation.isPending}
                hintLevel={currentHintLevel}
                onHintRequest={handleHintRequest}
              />
            ) : (
              <QuizQuestion
                question={currentQuestion}
                selectedAnswer={readAnswerOf(answers[currentQuestion.id])}
                onAnswer={handleAnswer}
                disabled={submitMutation.isPending}
                hintLevel={currentHintLevel}
                onHintRequest={handleHintRequest}
                freeHintCount={freeHintCount}
                hintedCount={hintedCount}
              />
            )}
          </div>
        </div>
      </div>

      {submitMutation.isError && (
        <div className="relative z-10 px-4 py-2">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between text-sm py-2 px-4 rounded-xl border border-chamber-line bg-chamber-panel">
              <span className="text-coral font-semibold">퀴즈 제출 중 오류가 발생했어요.</span>
              <button
                onClick={handleSubmit}
                className="text-coral hover:text-chamber-ink font-bold underline transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

      <QuizNavigation
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={isLastQuestion}
        isAnswered={isAnswered}
        canSubmit={canSubmit}
        isSubmitting={submitMutation.isPending}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </div>
  );
}
