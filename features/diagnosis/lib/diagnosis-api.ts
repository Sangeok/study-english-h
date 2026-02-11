import { apiClient } from "@/shared/lib";
import type { DiagnosisQuestion, DiagnosisAnswer } from "@/entities/question";

export interface DiagnosisStatusResponse {
  hasCompleted: boolean;
  cefrLevel: string | null;
  completedAt: string | null;
  canRetake: boolean;
  daysUntilRetake: number;
}

export interface DiagnosisStartResponse {
  questions: DiagnosisQuestion[];
  totalQuestions: number;
  timeLimit: number;
}

export interface DiagnosisSubmitResponse {
  diagnosisId: string;
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: { category: string; accuracy: number }[];
  recommendedStartPoint: string;
}

export async function fetchDiagnosisStatus() {
  return apiClient.get<DiagnosisStatusResponse>("/api/diagnosis/status");
}

export async function fetchDiagnosisQuestions(): Promise<DiagnosisStartResponse> {
  return apiClient.get<DiagnosisStartResponse>("/api/diagnosis/start");
}

export async function submitDiagnosis(
  answers: DiagnosisAnswer[]
): Promise<DiagnosisSubmitResponse> {
  return apiClient.post<DiagnosisSubmitResponse>("/api/diagnosis/submit", {
    answers,
  });
}
