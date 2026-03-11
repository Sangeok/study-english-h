export { DiagnosisTest, DiagnosisResult } from "./ui";
export { WeaknessAreas, WeaknessAreasList } from "./ui/result/weakness-areas-list";
export { calculateDiagnosisScore, normalizeWeaknessAreas } from "./lib";
export { useDiagnosisStatus } from "./hooks/use-diagnosis-status";
export type {
  DiagnosisResult as DiagnosisResultType,
  DiagnosisResultDetail,
  WeaknessArea,
} from "./types";
export type { DiagnosisStatusResponse } from "./api/diagnosis-api";
