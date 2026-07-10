import type { DiagnosisQuestion, DiagnosisSubmitAnswer } from "@/entities/question";
import { apiClient } from "@/shared/lib";
import type { DiagnosisResult, DiagnosisResultDetail, WeaknessArea } from "../types";

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

export interface DiagnosisSubmitResponse extends DiagnosisResult {
  diagnosisId: string;
}

export interface DiagnosisResultResponse extends DiagnosisResultDetail {
  weaknessAreas: WeaknessArea[];
}

export async function fetchDiagnosisStatus(): Promise<DiagnosisStatusResponse> {
  return apiClient.get<DiagnosisStatusResponse>("/api/diagnosis/status");
}

export async function fetchDiagnosisQuestions(): Promise<DiagnosisStartResponse> {
  return apiClient.get<DiagnosisStartResponse>("/api/diagnosis/start");
}

export async function submitDiagnosis(body: {
  answers: DiagnosisSubmitAnswer[];
}): Promise<DiagnosisSubmitResponse> {
  return apiClient.post<DiagnosisSubmitResponse>("/api/diagnosis/submit", body);
}

/** 게스트 진단 채점 — 무인증·미저장. submit과 body 동일, 응답에 diagnosisId·gamification 없음. */
export async function previewDiagnosis(body: {
  answers: DiagnosisSubmitAnswer[];
}): Promise<DiagnosisResult> {
  return apiClient.post<DiagnosisResult>("/api/diagnosis/preview", body);
}

export async function fetchDiagnosisResult(
  diagnosisId: string
): Promise<DiagnosisResultResponse> {
  return apiClient.get<DiagnosisResultResponse>(`/api/diagnosis/${diagnosisId}`);
}
