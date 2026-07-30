"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, apiClient, queryKeys } from "@/shared/lib";
import type { ListeningGap } from "../api/get-listening-gap";

export type { ListeningGap };

/**
 * 표본이 부족하면 서버가 `{ gap: null }` 을 내려준다 — 오류가 아니라 정상 응답이다.
 * 두 형태를 한 유니온으로 받아 호출부가 `gap === null` 하나로 분기하게 한다.
 */
export type ListeningGapResponse = ListeningGap | { gap: null };

async function fetchListeningGap(): Promise<ListeningGapResponse> {
  return apiClient.get<ListeningGapResponse>("/api/dashboard/listening-gap");
}

/**
 * use-profile-stats 미러.
 *
 * 대시보드 화면 컴포넌트가 이 훅을 직접 부르지 않는다 — views/dashboard/hooks/use-dashboard-data.ts
 * 가 조립해 index.tsx 로 넘기고, ui/ 컴포넌트는 전부 props 만 받는 표시 전용이다.
 * 조립 지점이 둘로 갈리면 대시보드 데이터의 출처를 한 곳에서 볼 수 없게 된다.
 */
export function useListeningGap(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.listeningGap(),
    queryFn: fetchListeningGap,
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
