"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys, ApiError } from "@/shared/lib";
import { DIAGNOSIS_TIME_LIMIT_SECONDS } from "@/shared/constants";
import type { DiagnosisSubmitAnswer } from "@/entities/question";
import type { DiagnosisResult } from "../types";
import {
  fetchDiagnosisQuestions,
  submitDiagnosis,
  previewDiagnosis,
  type DiagnosisSubmitResponse,
} from "../api/diagnosis-api";

/**
 * @param isGuest 게스트(미인증)면 채점만 하는 preview로, 인증이면 저장하는 submit으로 제출한다.
 */
export function useDiagnosisQuiz(isGuest: boolean) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.diagnosis.start(),
    queryFn: fetchDiagnosisQuestions,
    staleTime: Infinity,
    // 4xx(예: 쿨다운 409)는 재시도해도 동일하게 실패하므로 즉시 노출한다.
    // 네트워크/5xx 등 일시적 오류만 최대 2회 재시도.
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // 제출한 20문항 배열. 게스트 경로는 이 배열을 sessionStorage에 저장(가입 후 재전송용)이라 노출한다.
  const [submittedAnswers, setSubmittedAnswers] = useState<DiagnosisSubmitAnswer[]>([]);

  const submitMutation = useMutation<
    DiagnosisResult | DiagnosisSubmitResponse,
    Error,
    { answers: DiagnosisSubmitAnswer[] }
  >({
    mutationFn: (body) => (isGuest ? previewDiagnosis(body) : submitDiagnosis(body)),
  });

  const questions = useMemo(() => data?.questions ?? [], [data?.questions]);
  const timeLimit = data?.timeLimit ?? DIAGNOSIS_TIME_LIMIT_SECONDS;

  const submit = useCallback(
    (answersById: Record<string, string>) => {
      if (questions.length === 0) return;
      const answers = questions.map((q) => ({
        questionId: q.id,
        // 미답변 문항은 빈 문자열로 전송 — 서버에서 isCorrect: false 로 자연 처리.
        selectedText: answersById[q.id] ?? "",
      }));
      setSubmittedAnswers(answers);
      submitMutation.mutate({ answers });
    },
    [questions, submitMutation]
  );

  return {
    questions,
    timeLimit,
    isLoading,
    isError,
    submit,
    submittedAnswers,
    isSubmitting: submitMutation.isPending,
    submitResult: submitMutation.data,
    submitError: submitMutation.error,
    isSubmitSuccess: submitMutation.isSuccess,
    refetchQuestions: refetch,
  };
}
