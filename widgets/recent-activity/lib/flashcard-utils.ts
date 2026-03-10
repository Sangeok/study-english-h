import type { QualityCounts } from "../model";

export function hasFlashcardQualityCounts(qualityCounts: QualityCounts): boolean {
  return qualityCounts.easy + qualityCounts.normal + qualityCounts.hard + qualityCounts.forgot > 0;
}
