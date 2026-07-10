"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MIN_DIAGNOSIS_ANSWERS } from "@/shared/constants";
import { TRANSITION_DURATION_MS } from "../../config";
import { useDiagnosisQuiz } from "../../hooks/use-diagnosis-quiz";
import { useDiagnosisTimer } from "../../hooks/use-diagnosis-timer";
import { useUnsavedDiagnosisWarning } from "../../hooks/use-unsaved-diagnosis-warning";
import { saveGuestDiagnosis } from "../../lib/guest-diagnosis-storage";
import { DiagnosisNavigation } from "./diagnosis-navigation";
import { DiagnosisQuestionCard } from "./diagnosis-question-card";
import { DiagnosisError } from "../status/diagnosis-error";
import { DiagnosisExpired } from "../status/diagnosis-expired";
import { DiagnosisLoading } from "../status/diagnosis-loading";
import { GuestDiagnosisResult } from "../result/guest-diagnosis-result";
import { DiagnosisProgressBar } from "../shared/diagnosis-progress-bar";

interface DiagnosisTestProps {
  isAuthenticated: boolean;
}

export function DiagnosisTest({ isAuthenticated }: DiagnosisTestProps) {
  const router = useRouter();
  const isGuest = !isAuthenticated;
  const {
    questions,
    timeLimit,
    isLoading,
    isError,
    submit,
    submittedAnswers,
    isSubmitting,
    submitResult,
    isSubmitSuccess,
    refetchQuestions,
  } = useDiagnosisQuiz(isGuest);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timerExpiredInsufficient, setTimerExpiredInsufficient] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleSubmit = useCallback(() => {
    submit(answers);
  }, [submit, answers]);

  const handleTimerExpire = useCallback(() => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount >= MIN_DIAGNOSIS_ANSWERS) {
      submit(answers);
      return;
    }
    setTimerExpiredInsufficient(true);
  }, [submit, answers]);

  const { minutes, seconds, timePercentage, isTimeWarning } =
    useDiagnosisTimer(timeLimit, handleTimerExpire, retryCount);

  const hasAnswers = Object.keys(answers).length > 0;
  useUnsavedDiagnosisWarning(hasAnswers && !isSubmitSuccess);

  useEffect(() => {
    if (!isSubmitSuccess || !submitResult) return;

    if (isGuest) {
      // 게스트: 답변+결과를 sessionStorage에 저장(가입 후 재전송용). 결과 렌더는 파생값으로 처리.
      saveGuestDiagnosis({ answers: submittedAnswers, result: submitResult });
      return;
    }

    // 인증: 서버에 저장된 진단 결과 상세 페이지로 이동(submit 응답의 diagnosisId).
    if ("diagnosisId" in submitResult) {
      router.push(`/diagnosis/result?id=${submitResult.diagnosisId}`);
    }
  }, [isSubmitSuccess, submitResult, isGuest, submittedAnswers, router]);

  const navigateQuestion = useCallback(
    (direction: "next" | "prev") => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          if (direction === "next") {
            return Math.min(questions.length - 1, prev + 1);
          }
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

  const handleRetry = useCallback(() => {
    setTimerExpiredInsufficient(false);
    setAnswers({});
    setCurrentIndex(0);
    setRetryCount((c) => c + 1);
    refetchQuestions();
  }, [refetchQuestions]);

  // 게스트 제출 성공 → 인라인 결과 화면(가입 CTA 포함). submitResult에서 직접 파생.
  if (isGuest && isSubmitSuccess && submitResult) {
    return <GuestDiagnosisResult result={submitResult} />;
  }

  if (isLoading) {
    return <DiagnosisLoading />;
  }

  if (isError || questions.length === 0) {
    return (
      <DiagnosisError
        title="진단 문제를 불러오지 못했어요"
        description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
        onRetry={() => void refetchQuestions()}
      />
    );
  }

  if (timerExpiredInsufficient) {
    return (
      <DiagnosisExpired
        answeredCount={Object.keys(answers).length}
        requiredCount={MIN_DIAGNOSIS_ANSWERS}
        onGoHome={() => router.push("/")}
        onRetry={handleRetry}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-chamber">
      <div className="relative z-10 px-4 py-8 md:px-8">
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
