export {
  DiagnosisResult,
  DiagnosisTest,
  GuestDiagnosisMigrationNotice,
} from "./ui";
export { WeaknessAreas } from "./ui/result/weakness-areas-list";
export { normalizeWeaknessAreas } from "./lib/normalize-weakness-areas";
export { useDiagnosisStatus } from "./hooks/use-diagnosis-status";
export type {
  DiagnosisResult as DiagnosisResultType,
  DiagnosisResultDetail,
  WeaknessArea,
} from "./types";
export type { DiagnosisStatusResponse } from "./api/diagnosis-api";
