"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { fetchDailyQuiz } from "../api/quiz-api";
import type { DailyQuizItem } from "../types";

interface DailyQuizReturn {
  questions: DailyQuizItem[];
  userLevel: string;
  hasCompletedToday: boolean;
  freeHintCount: number;
}

/**
 * listeningEnabled 는 **필수 인자**다. 기본값을 주면 호출부가 값을 안 넘겨도 컴파일돼,
 * 게이트 배선이 빠진 채로 지나간다 — 그 순간 쿼리 키와 실제 요청이 어긋난다.
 */
export function useDailyQuiz(listeningEnabled: boolean): DailyQuizReturn {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.quiz.daily(listeningEnabled),
    queryFn: () => fetchDailyQuiz(undefined, listeningEnabled),
    gcTime: 0,        // 언마운트 시 즉시 캐시 제거
    staleTime: Infinity, // 배경 리페치 없음 — removeQueries로만 갱신
  });

  return {
    questions: data.questions,
    userLevel: data.userLevel,
    hasCompletedToday: data.hasCompletedToday,
    freeHintCount: data.freeHintCount,
  };
}
