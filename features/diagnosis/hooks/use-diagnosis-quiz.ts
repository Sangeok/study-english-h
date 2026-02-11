"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DiagnosisAnswer } from "@/entities/question";
import { queryKeys } from "@/shared/lib";
import { DIAGNOSIS_TIME_LIMIT_SECONDS } from "@/shared/constants";
import {
  fetchDiagnosisQuestions,
  submitDiagnosis,
} from "../lib/diagnosis-api";

export function useDiagnosisQuiz() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.diagnosis.start(),
    queryFn: fetchDiagnosisQuestions,
    staleTime: Infinity,
  });

  const submitMutation = useMutation({
    mutationFn: submitDiagnosis,
  });

  const questions = data?.questions ?? [];
  const timeLimit = data?.timeLimit ?? DIAGNOSIS_TIME_LIMIT_SECONDS;

  const submit = useCallback(
    (answersById: Record<string, string>) => {
      if (questions.length === 0) return;

      const formattedAnswers: DiagnosisAnswer[] = questions.map((question) => ({
        questionId: question.id,
        difficulty: question.difficulty,
        isCorrect:
          question.options.find((option) => option.isCorrect)?.text ===
          answersById[question.id],
        category: question.category,
      }));

      submitMutation.mutate(formattedAnswers);
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
  };
}
