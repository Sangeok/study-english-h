"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { submitQuiz, type QuizSubmission } from "../lib/quiz-api";
import { QuizQuestion } from "./game/quiz-question";
import { QuizFeedback } from "./result/quiz-feedback";
import { QuizHeader } from "./game/quiz-header";
import { QuizNavigation } from "./game/quiz-navigation";
import { QuizLoading } from "./status/quiz-loading";
import { QuizError } from "./status/quiz-error";
import { QuizEmpty } from "./status/quiz-empty";
import { useDailyQuiz } from "../hooks/use-daily-quiz";
import { useQuizAnswers } from "../hooks/use-quiz-answers";
import { useQuizNavigation } from "../hooks/use-quiz-navigation";

export function QuizContainer() {
  const router = useRouter();
  const { questions, userLevel, isLoading, isError, refetch } = useDailyQuiz();
  const answersRef = useRef<Record<string, QuizSubmission>>({});

  const submitMutation = useMutation({
    mutationFn: submitQuiz,
    onError: (error) => {
      console.error("Quiz submit error:", error);
    },
  });

  const handleSubmit = useCallback(() => {
    const answerList = Object.values(answersRef.current);
    submitMutation.mutate(answerList);
  }, [submitMutation]);

  const { currentIndex, isTransitioning, goNext, goPrevious } = useQuizNavigation(questions.length, handleSubmit);
  const { answers, hintLevels, handleAnswer, handleHintRequest } = useQuizAnswers(
    questions,
    currentIndex,
    submitMutation.isSuccess
  );

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  if (isLoading) {
    return <QuizLoading />;
  }

  if (isError) {
    return <QuizError onRetry={refetch} />;
  }

  if (questions.length === 0) {
    return <QuizEmpty onGoMain={() => router.push("/main")} />;
  }

  if (submitMutation.isSuccess && submitMutation.data) {
    return <QuizFeedback result={submitMutation.data} />;
  }

  const currentQuestion = questions[currentIndex];
  const currentHintLevel = hintLevels[currentQuestion.id] ?? 0;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = !!answers[currentQuestion.id];
  const canSubmit = answeredCount === questions.length;

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 overflow-hidden flex flex-col">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
      </div>

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
            />
          </div>
        </div>
      </div>

      {submitMutation.isError && (
        <div className="relative z-10 px-4 py-2">
          <div className="max-w-5xl mx-auto">
            <div className="text-red-400 text-sm text-center py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              퀴즈 제출 중 오류가 발생했습니다. 다시 시도해주세요.
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
