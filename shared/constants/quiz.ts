export const DEFAULT_QUIZ_COUNT = 10;
export const WEAKNESS_QUESTION_RATIO = 0.5; // 50%
export const RECENT_EXCLUSION_RATIO = 0.6;  // 최근 풀이 제외 비율 (풀 크기의 60%)
export const RECENT_EXCLUSION_MAX = 30;     // 최근 풀이 제외 최대 문제 수

export const QUIZ_ANIMATION = {
  OPTION_SELECT_DELAY_MS: 250,
  SPARKLE_DURATION_MS: 1000,
  SPARKLE_COUNT: 6,
} as const;

export const QUIZ_PERFORMANCE_THRESHOLDS = {
  PERFECT: 90,
  EXCELLENT: 80,
  GOOD: 70,
  FAIR: 60,
} as const;

export const QUIZ_CONFETTI = {
  HIGH_ACCURACY_THRESHOLD: 80,
  HIGH_COUNT: 80,
  LOW_COUNT: 50,
} as const;
