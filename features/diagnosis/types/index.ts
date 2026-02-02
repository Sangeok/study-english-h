export type { DiagnosisAnswer, DiagnosisQuestion } from "@/entities/question";

export interface DiagnosisResult {
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: {
    category: string;
    accuracy: number;
  }[];
  recommendedStartPoint: string;
}
