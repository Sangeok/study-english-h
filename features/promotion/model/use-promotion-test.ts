"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, queryKeys } from "@/shared/lib";
import { PROMOTION } from "@/shared/constants";
import {
  startPromotionTest,
  submitPromotionTest,
  type PromotionAnswer,
  type PromotionSubmitResponse,
} from "../api/promotion-api";
import { toPromotionFailure, type PromotionFailure } from "../lib/promotion-failure";

type Phase = "loading" | "answering" | "submitting" | "done" | "failed";

export function usePromotionTest() {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<PromotionAnswer[]>([]);

  // start 는 POST 지만 서버가 멱등이다 — 유효 세션이 있으면 같은 세션·같은 문항을 돌려준다(§4-2).
  //   그래서 StrictMode 이중 마운트나 재마운트가 진행 중 응시를 무효화하지 않는다.
  const startQuery = useQuery({
    queryKey: queryKeys.promotion.start(),
    queryFn: startPromotionTest,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // 403(미자격)·503(콘텐츠 부족)은 재시도해도 같은 결과다.
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const submitMutation = useMutation<PromotionSubmitResponse, Error, PromotionAnswer[]>({
    mutationFn: (submitted) => {
      const sessionId = startQuery.data?.sessionId;
      if (!sessionId) throw new Error("세션이 없습니다");
      return submitPromotionTest(sessionId, submitted);
    },
    onSuccess: (result) => {
      if (!result.passed) return;
      // 승급 직후 홈·대시보드가 옛 레벨을 보이지 않도록 stats 캐시를 무효화한다.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });

  const answer = useCallback((questionId: string, selectedText: string) => {
    setAnswers((previous) => [
      ...previous.filter((item) => item.questionId !== questionId),
      { questionId, selectedText },
    ]);
  }, []);

  const submit = useCallback(() => {
    if (answers.length !== PROMOTION.QUESTION_COUNT) return;
    submitMutation.mutate(answers);
  }, [answers, submitMutation]);

  /** "다시 시작" — 세션이 만료·무효가 된 경우 새 세션을 받는다. */
  const restart = useCallback(() => {
    setAnswers([]);
    submitMutation.reset();
    void startQuery.refetch();
  }, [startQuery, submitMutation]);

  const failure: PromotionFailure | null = submitMutation.error
    ? toPromotionFailure(submitMutation.error)
    : startQuery.error
      ? toPromotionFailure(startQuery.error)
      : null;

  const phase: Phase = startQuery.isPending
    ? "loading"
    : failure
      ? "failed"
      : submitMutation.isPending
        ? "submitting"
        : submitMutation.data
          ? "done"
          : "answering";

  return {
    phase,
    failure,
    toLevel: startQuery.data?.toLevel ?? null,
    questions: startQuery.data?.questions ?? [],
    answers,
    result: submitMutation.data ?? null,
    answer,
    submit,
    restart,
  };
}
