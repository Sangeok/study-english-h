import type { DiagnosisStatusResponse } from "@/features/diagnosis";
import type { FeatureCardStatus } from "@/shared/ui";

/**
 * 진단 상태에 따른 Feature Card 상태 결정
 */
export function getDiagnosisCardStatus(
  diagnosisStatus: DiagnosisStatusResponse | undefined
): FeatureCardStatus {
  if (!diagnosisStatus?.hasCompleted) {
    return 'available';
  }

  if (!diagnosisStatus.canRetake) {
    return 'completed';
  }

  return 'available';
}

/**
 * 퀴즈 카드 상태 결정 (진단 완료 여부에 따라)
 */
export function getQuizCardStatus(
  diagnosisCompleted: boolean
): FeatureCardStatus {
  return diagnosisCompleted ? 'available' : 'locked';
}

