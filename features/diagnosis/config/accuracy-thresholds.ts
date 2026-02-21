export const ACCURACY_THRESHOLDS = {
  CRITICAL: 40,
  WEAK: 60,
  MODERATE: 75,
  GOOD: 80,
} as const;

export interface AccuracyStyle {
  gradient: string;
  bg: string;
  border: string;
  emoji: string;
  label: string;
}
