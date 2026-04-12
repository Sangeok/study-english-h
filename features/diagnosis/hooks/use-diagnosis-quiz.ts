"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { DIAGNOSIS_TIME_LIMIT_SECONDS } from "@/shared/constants";
import {
  fetchDiagnosisQuestions,
  submitDiagnosis,
} from "../api/diagnosis-api";

export function useDiagnosisQuiz() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.diagnosis.start(),
    queryFn: fetchDiagnosisQuestions,
    staleTime: Infinity,
  });

  const submitMutation = useMutation({
    mutationFn: submitDiagnosis,
  });

  const questions = useMemo(() => data?.questions ?? [], [data?.questions]);
  const timeLimit = data?.timeLimit ?? DIAGNOSIS_TIME_LIMIT_SECONDS;

  const submit = useCallback(
    (answersById: Record<string, string>) => {
      if (questions.length === 0) return;
      submitMutation.mutate({
        answers: questions.map((q) => ({
          questionId: q.id,
          // 미답변 문항은 빈 문자열로 전송 — 서버에서 isCorrect: false 로 자연 처리.
          selectedText: answersById[q.id] ?? "",
        })),
      });
    },
    [questions, submitMutation]
  );

  return {
    questions,
    timeLimit,
    isLoading,
    isError,
    submit,
    isSubmitting: submitMutation.isPending,
    submitResult: submitMutation.data,
    submitError: submitMutation.error,
    isSubmitSuccess: submitMutation.isSuccess,
    refetchQuestions: refetch,
  };
}
