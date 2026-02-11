"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDiagnosisQuiz } from "../../hooks/use-diagnosis-quiz";
import { useDiagnosisTimer } from "../../hooks/use-diagnosis-timer";
import { TRANSITION_DURATION_MS } from "../../constants";
import { DiagnosisLoading } from "../status/diagnosis-loading";
import { DiagnosisError } from "../status/diagnosis-error";
import { DiagnosisProgressBar } from "../shared/diagnosis-progress-bar";
import { DiagnosisQuestionCard } from "./diagnosis-question-card";
import { DiagnosisNavigation } from "./diagnosis-navigation";

export function DiagnosisTest() {
  const router = useRouter();
  const {
    questions,
    timeLimit,
    isLoading,
    isError,
    submit,
    isSubmitting,
    submitResult,
    isSubmitSuccess,
  } = useDiagnosisQuiz();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = useCallback(() => {
    submit(answers);
  }, [submit, answers]);

  const { minutes, seconds, timePercentage, isTimeWarning } =
    useDiagnosisTimer(timeLimit, handleSubmit);

  useEffect(() => {
    if (isSubmitSuccess && submitResult) {
      router.push(`/diagnosis/result?id=${submitResult.diagnosisId}`);
    }
  }, [isSubmitSuccess, submitResult, router]);

  const navigateQuestion = useCallback(
    (direction: "next" | "prev") => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          if (direction === "next")
            return Math.min(questions.length - 1, prev + 1);
          return Math.max(0, prev - 1);
        });
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);
    },
    [questions.length]
  );

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  if (isLoading) {
    return <DiagnosisLoading />;
  }

  if (isError || questions.length === 0) {
    return (
      <DiagnosisError
        title="문제를 불러올 수 없어요"
        description="네트워크 연결을 확인하고 다시 시도해주세요."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "25s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <DiagnosisProgressBar
            progress={{
              currentIndex,
              totalQuestions: questions.length,
              answeredCount,
              percentage: ((currentIndex + 1) / questions.length) * 100,
            }}
            timer={{
              minutes,
              seconds,
              percentage: timePercentage,
              isWarning: isTimeWarning,
            }}
          />

          <DiagnosisQuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
            disabled={isSubmitting}
            isTransitioning={isTransitioning}
          />

          <DiagnosisNavigation
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            isLastQuestion={isLastQuestion}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            hasCurrentAnswer={Boolean(answers[currentQuestion.id])}
            onPrevious={() => navigateQuestion("prev")}
            onNext={() => navigateQuestion("next")}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
