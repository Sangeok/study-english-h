"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { fetchDailyQuiz } from "../api/quiz-api";
import type { DailyQuizItem, DailyQuizResponse } from "../types";

interface DailyQuizReturn {
  questions: DailyQuizItem[];
  userLevel: string;
  hasCompletedToday: boolean;
  freeHintCount: number;
}

/**
 * listeningEnabled 는 **필수 인자**다. 기본값을 주면 호출부가 값을 안 넘겨도 컴파일돼,
 * 게이트 배선이 빠진 채로 지나간다 — 그 순간 쿼리 키와 실제 요청이 어긋난다.
 *
 * restored 는 진행 중이던 세션의 문항이다(quiz-session-storage). useSuspenseQuery 는
 * 조건부로 호출할 수 없으므로 initialData 로 넣는다 — react-query 는 initialData 를
 * `dataUpdatedAt = now` 로 캐시에 앉히고, staleTime: Infinity 라 stale 이 아니어서
 * 마운트 리페치도 일어나지 않는다. **여기서 페치가 돌면 복원이 무의미해진다**:
 * 새로 뽑힌 문항이 화면에 오고 복원된 답안이 다시 고아가 된다.
 */
export function useDailyQuiz(
  listeningEnabled: boolean,
  restored?: DailyQuizResponse
): DailyQuizReturn {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.quiz.daily(listeningEnabled),
    queryFn: () => fetchDailyQuiz(undefined, listeningEnabled),
    // 조건부 스프레드 — undefined 를 명시적으로 넘기면 "초기 데이터 없음"과 구분되지 않는다.
    ...(restored ? { initialData: restored } : {}),
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
