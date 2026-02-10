import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { fetchDiagnosisStatus } from "../lib/diagnosis-api";

export function useDiagnosisStatus() {
  return useQuery({
    queryKey: queryKeys.diagnosis.status(),
    queryFn: fetchDiagnosisStatus,
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
}
