export { DiagnosisTest, DiagnosisResult } from "./ui";
export { WeaknessAreas } from "./ui/weakness-areas";
export { calculateDiagnosisScore } from "./lib/scoring";
export { useDiagnosisStatus } from "./hooks/use-diagnosis-status";
export type { DiagnosisAnswer, DiagnosisQuestion } from "@/entities/question";
export type { DiagnosisResult as DiagnosisResultType } from "./types";
export type { DiagnosisStatusResponse } from "./lib/diagnosis-api";