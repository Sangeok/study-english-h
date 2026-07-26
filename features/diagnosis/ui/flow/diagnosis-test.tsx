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

  // 응답 상태는 반드시 "지금 내려온 문항" 기준으로만 센다.
  // answers 는 문항 id 로 쌓이는데, 문항 세트가 교체되면(쿼리 리페치) 이전 세트의 키가
  // 남는다. 그걸 그대로 세면 응답 수가 총 문항 수를 넘어(예: 21/20) 제출이 영구 차단된다.
  const answeredFlags = questions.map((question) => Boolean(answers[question.id]));
  const answeredCount = answeredFlags.filter(Boolean).length;
  const firstUnansweredIndex = answeredFlags.findIndex((answered) => !answered);
  // 순서대로 답해야 진행되므로 이동 가능한 마지막 위치는 "첫 미응답 문항"이다.
  // (전부 응답했다면 마지막 문항)
  const maxReachableIndex =
    firstUnansweredIndex === -1 ? questions.length - 1 : firstUnansweredIndex;

  const handleSubmit = useCallback(() => {
    submit(answers);
  }, [submit, answers]);

  const handleTimerExpire = useCallback(() => {
    if (answeredCount >= MIN_DIAGNOSIS_ANSWERS) {
      submit(answers);
      return;
    }
    setTimerExpiredInsufficient(true);
  }, [submit, answers, answeredCount]);

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

  const goToQuestion = useCallback(
    (index: number) => {
      // 상한을 maxReachableIndex 로 고정 — 미응답 문항을 건너뛴 이동(다음 버튼·진행 바
      // 점프)을 한곳에서 차단한다. 뒤로 되돌아가는 이동은 그대로 허용.
      const target = Math.max(0, Math.min(maxReachableIndex, index));
      if (target === currentIndex) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(target);
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);
    },
    [currentIndex, maxReachableIndex]
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

  // 인증 경로는 결과 라우트로 이동이 끝날 때까지 이 컴포넌트가 살아 있다.
  // 그동안 퀴즈를 계속 조작할 수 있으면 제출 뒤의 클릭이 답안에 섞이므로 화면을 닫는다.
  if (!isGuest && isSubmitSuccess) {
    return (
      <DiagnosisLoading title="제출 완료" description="결과 페이지로 이동하고 있어요" />
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
        answeredCount={answeredCount}
        requiredCount={MIN_DIAGNOSIS_ANSWERS}
        onGoHome={() => router.push("/")}
        onRetry={handleRetry}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
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
              // 진행률은 "현재 위치"가 아니라 "실제 답한 개수" 기준.
              // (위치 기준이면 마지막 문항 도달 시 미답변이 있어도 100%로 표시돼
              //  "19/20 완료"·제출 비활성과 어긋난다)
              percentage: (answeredCount / questions.length) * 100,
              answeredFlags,
              maxReachableIndex,
            }}
            timer={{
              minutes,
              seconds,
              percentage: timePercentage,
              isWarning: isTimeWarning,
            }}
            onJump={goToQuestion}
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
            onPrevious={() => goToQuestion(currentIndex - 1)}
            onNext={() => goToQuestion(currentIndex + 1)}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
