"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_DIAGNOSIS_ANSWERS } from "@/shared/constants";
import { TRANSITION_DURATION_MS } from "../../config";
import { useDiagnosisQuiz } from "../../hooks/use-diagnosis-quiz";
import { useDiagnosisTimer } from "../../hooks/use-diagnosis-timer";
import { useUnsavedDiagnosisWarning } from "../../hooks/use-unsaved-diagnosis-warning";
import {
  clearGuestDiagnosis,
  readGuestDiagnosis,
  saveGuestDiagnosis,
  type GuestDiagnosisReadResult,
} from "../../lib/guest-diagnosis-storage";
import { DiagnosisNavigation } from "./diagnosis-navigation";
import { DiagnosisQuestionCard } from "./diagnosis-question-card";
import { DiagnosisError } from "../status/diagnosis-error";
import { DiagnosisExpired } from "../status/diagnosis-expired";
import { DiagnosisLoading } from "../status/diagnosis-loading";
import {
  GuestDiagnosisResult,
  type GuestDiagnosisCacheState,
} from "../result/guest-diagnosis-result";
import { DiagnosisProgressBar } from "../shared/diagnosis-progress-bar";

interface DiagnosisTestProps {
  isAuthenticated: boolean;
}

type GuestCacheRestoreState =
  | { status: "checking" }
  | GuestDiagnosisReadResult;

export function DiagnosisTest({ isAuthenticated }: DiagnosisTestProps) {
  const [cacheRestoreState, setCacheRestoreState] =
    useState<GuestCacheRestoreState>({ status: "checking" });

  const readCachedDiagnosis = useCallback(() => {
    setCacheRestoreState(readGuestDiagnosis());
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      return;
    }

    queueMicrotask(() => {
      if (!cancelled) {
        readCachedDiagnosis();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, readCachedDiagnosis]);

  const handleDiscardInvalidCache = useCallback(() => {
    const clearResult = clearGuestDiagnosis();

    if (clearResult.status === "unavailable") {
      setCacheRestoreState({ status: "unavailable" });
      return;
    }

    setCacheRestoreState({ status: "empty" });
  }, []);

  if (isAuthenticated) {
    return <DiagnosisQuizFlow isAuthenticated />;
  }

  if (cacheRestoreState.status === "checking") {
    return <DiagnosisLoading />;
  }

  if (cacheRestoreState.status === "ready") {
    return (
      <GuestDiagnosisResult
        result={cacheRestoreState.diagnosis.result}
        cacheState={{ status: "ready" }}
      />
    );
  }

  if (cacheRestoreState.status === "invalid") {
    return (
      <DiagnosisError
        title="저장된 진단 결과가 손상됐어요"
        description="손상된 임시 결과를 삭제한 뒤 진단을 다시 시작해 주세요."
        actionLabel="저장된 결과 삭제하고 진단 다시 시작"
        onRetry={handleDiscardInvalidCache}
      />
    );
  }

  if (cacheRestoreState.status === "unavailable") {
    return (
      <DiagnosisError
        title="저장된 진단 결과를 확인하지 못했어요"
        description="브라우저 저장소를 다시 확인한 뒤 진단을 계속할게요."
        actionLabel="다시 확인"
        onRetry={readCachedDiagnosis}
      />
    );
  }

  return <DiagnosisQuizFlow isAuthenticated={false} />;
}

function DiagnosisQuizFlow({ isAuthenticated }: DiagnosisTestProps) {
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
  const [guestCacheStatus, setGuestCacheStatus] =
    useState<GuestDiagnosisCacheState["status"]>("saving");

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

  const saveGuestResult = useCallback(() => {
    if (!submitResult) {
      return;
    }

    setGuestCacheStatus("saving");
    const saveResult = saveGuestDiagnosis({
      answers: submittedAnswers,
      result: submitResult,
    });

    if (saveResult.status === "unavailable") {
      setGuestCacheStatus("error");
      return;
    }

    setGuestCacheStatus("ready");
  }, [submitResult, submittedAnswers]);

  const hasAnswers = Object.keys(answers).length > 0;
  const hasUnsavedGuestResult =
    isGuest &&
    isSubmitSuccess &&
    guestCacheStatus !== "ready";
  useUnsavedDiagnosisWarning(
    hasAnswers && (!isSubmitSuccess || hasUnsavedGuestResult)
  );

  useEffect(() => {
    if (!isSubmitSuccess || !submitResult) {
      return;
    }

    if (isGuest) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          saveGuestResult();
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if ("diagnosisId" in submitResult) {
      router.push(`/diagnosis/result?id=${submitResult.diagnosisId}`);
    }
  }, [isSubmitSuccess, submitResult, isGuest, saveGuestResult, router]);

  const navigateQuestion = useCallback(
    (direction: "next" | "prev") => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((previousIndex) => {
          if (direction === "next") {
            return Math.min(questions.length - 1, previousIndex + 1);
          }
          return Math.max(0, previousIndex - 1);
        });
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);
    },
    [questions.length]
  );

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));
  }, []);

  const handleRetry = useCallback(() => {
    setTimerExpiredInsufficient(false);
    setAnswers({});
    setCurrentIndex(0);
    setRetryCount((currentRetryCount) => currentRetryCount + 1);
    refetchQuestions();
  }, [refetchQuestions]);

  if (isGuest && isSubmitSuccess && submitResult) {
    const guestCacheState: GuestDiagnosisCacheState =
      guestCacheStatus === "error"
        ? { status: "error", onRetryCacheSave: saveGuestResult }
        : { status: guestCacheStatus };

    return (
      <GuestDiagnosisResult
        result={submitResult}
        cacheState={guestCacheState}
      />
    );
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
        <div className="mx-auto max-w-4xl">
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
