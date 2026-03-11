"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { DIAGNOSIS_TIME_LIMIT_SECONDS } from "@/shared/constants";
import {
  fetchDiagnosisQuestions,
  submitDiagnosis,
} from "../api/diagnosis-api";
import { formatDiagnosisAnswers } from "../lib/format-answers";

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
      submitMutation.mutate(formatDiagnosisAnswers(questions, answersById));
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
