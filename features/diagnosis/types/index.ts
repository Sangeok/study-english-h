export interface WeaknessArea {
  category: string;
  accuracy: number;
}

export interface DiagnosisResult {
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: WeaknessArea[];
  recommendedStartPoint: string;
}

export interface DiagnosisResultDetail {
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: WeaknessArea[];
  completedAt: string;
}
