import { useQuery } from "@tanstack/react-query";
import { ApiError, queryKeys } from "@/shared/lib";
import { fetchDiagnosisStatus } from "../lib/diagnosis-api";

export function useDiagnosisStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.diagnosis.status(),
    queryFn: fetchDiagnosisStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
