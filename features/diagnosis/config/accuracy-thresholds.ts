export const ACCURACY_THRESHOLDS = {
  CRITICAL: 40,
  WEAK: 60,
  GOOD: 80,
} as const;

export interface AccuracyStyle {
  status: string;
  label: string;
}
