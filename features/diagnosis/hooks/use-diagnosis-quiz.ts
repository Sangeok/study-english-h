"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { DiagnosisAnswer, DiagnosisQuestion } from "@/entities/question";
import { apiClient, ApiError, queryKeys } from "@/shared/lib";
import { DIAGNOSIS_TIME_LIMIT_SECONDS } from "@/shared/constants";

interface DiagnosisStartResponse {
  questions: DiagnosisQuestion[];
  totalQuestions: number;
  timeLimit: number;
}

interface DiagnosisSubmitResponse {
  diagnosisId: string;
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: { category: string; accuracy: number }[];
  recommendedStartPoint: string;
}

async function fetchDiagnosisQuestions(router: ReturnType<typeof useRouter>): Promise<DiagnosisStartResponse> {
  try {
    return await apiClient.get<DiagnosisStartResponse>("/api/diagnosis/start");
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      router.push("/?message=diagnosis_completed");
      throw new Error("진단이 이미 완료되었습니다");
    }
    throw error;
  }
}

async function submitDiagnosis(answers: DiagnosisAnswer[]): Promise<DiagnosisSubmitResponse> {
  return apiClient.post<DiagnosisSubmitResponse>("/api/diagnosis/submit", { answers });
}

export function useDiagnosisQuiz() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.diagnosis.start(),
    queryFn: () => fetchDiagnosisQuestions(router),
    staleTime: Infinity,
  });

  const submitMutation = useMutation({
    mutationFn: submitDiagnosis,
    onSuccess: (result) => {
      router.push(`/diagnosis/result?id=${result.diagnosisId}`);
    },
    onError: (error) => {
      console.error("Diagnosis submit error:", error);
      alert("진단 제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    },
  });

  const questions = data?.questions ?? [];
  const timeLimit = data?.timeLimit ?? DIAGNOSIS_TIME_LIMIT_SECONDS;

  const submit = useCallback(
    (answersById: Record<string, string>) => {
      if (questions.length === 0) {
        return;
      }

      const formattedAnswers: DiagnosisAnswer[] = questions.map((question) => ({
        questionId: question.id,
        difficulty: question.difficulty,
        isCorrect: question.options.find((option) => option.isCorrect)?.text === answersById[question.id],
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
  };
}
