import { apiClient } from "@/shared/lib";

export interface DiagnosisStatusResponse {
  hasCompleted: boolean;
  cefrLevel: string | null;
  completedAt: string | null;
  canRetake: boolean;
  daysUntilRetake: number;
}

export async function fetchDiagnosisStatus() {
  return apiClient.get<DiagnosisStatusResponse>("/api/diagnosis/status");
}
