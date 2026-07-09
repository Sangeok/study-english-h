"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { submitQuiz } from "../api/quiz-api";
import type { QuizSubmission } from "../types";
import { QuizQuestion } from "./game/quiz-question";
import { QuizFeedback } from "./result/quiz-feedback";
import { QuizHeader } from "./game/quiz-header";
import { QuizNavigation } from "./game/quiz-navigation";
import { QuizEmpty } from "./status/quiz-empty";
import { useRewardToast } from "@/features/gamification";
import { useDailyQuiz } from "../hooks/use-daily-quiz";
import { useQuizAnswers } from "../hooks/use-quiz-answers";
import { useQuizNavigation } from "../hooks/use-quiz-navigation";
import { useQuizState } from "../hooks/use-quiz-state";

export function QuizContainer() {
  const router = useRouter();
  const { questions, userLevel, hasCompletedToday, freeHintCount } = useDailyQuiz();
  const answersRef = useRef<Record<string, QuizSubmission>>({});
  const queryClient = useQueryClient();
  const { showRewards } = useRewardToast();

  const submitMutation = useMutation({
    mutationFn: submitQuiz,
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: queryKeys.quiz.daily() });
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
    handleSubmit
  );
  const { answers, hintLevels, handleAnswer, handleHintRequest } = useQuizAnswers(
    questions,
    currentIndex,
    submitMutation.isSuccess
  );
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
    return <QuizEmpty onGoMain={() => router.push("/main")} />;
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
            <QuizQuestion
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id]?.selectedAnswer}
              onAnswer={handleAnswer}
              disabled={submitMutation.isPending}
              hintLevel={currentHintLevel}
              onHintRequest={handleHintRequest}
              freeHintCount={freeHintCount}
              hintedCount={hintedCount}
            />
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
