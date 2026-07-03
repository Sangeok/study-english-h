/**
 * SM-2 Algorithm Implementation for Spaced Repetition System
 */

import type { MasteryLevel, ReviewQuality } from "../types";

// SRS card state
export interface SRSCard {
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  lastReviewDate: Date | null;
  masteryLevel: MasteryLevel;
}

// Result after calculating next review
export interface SRSResult {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
  masteryLevel: MasteryLevel;
}

const DEFAULT_INTERVALS = {
  new: 1,
  learning: 3,
  reviewing: 7,
  mastered: 180,
} as const;

// SM-2 튜닝 상수 — ease factor 관련 조정치는 모두 여기에 모은다.
export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;
const WRONG_ANSWER_EASE_PENALTY = 0.2;

const EASE_FACTOR_ADJUSTMENTS: Record<ReviewQuality, number> = {
  easy: 0.15,
  normal: 0.0,
  hard: -0.15,
  forgot: -0.2,
};

/**
 * Calculate next review date and update SRS parameters based on SM-2 algorithm.
 */
export function calculateNextReview(
  card: SRSCard,
  quality: ReviewQuality,
  isCorrect: boolean
): SRSResult {
  let { repetitions, easeFactor, interval } = card;

  if (!isCorrect) {
    repetitions = 0;
    interval = DEFAULT_INTERVALS.new;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - WRONG_ANSWER_EASE_PENALTY);

    return {
      repetitions,
      easeFactor,
      interval,
      nextReviewDate: addDays(new Date(), interval),
      masteryLevel: "new",
    };
  }

  repetitions += 1;
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + EASE_FACTOR_ADJUSTMENTS[quality]);

  if (repetitions === 1) {
    interval = DEFAULT_INTERVALS.new;
  } else if (repetitions === 2) {
    interval = DEFAULT_INTERVALS.learning;
  } else if (repetitions === 3) {
    interval = DEFAULT_INTERVALS.reviewing;
  } else {
    interval = Math.round(interval * easeFactor);
  }

  return {
    repetitions,
    easeFactor,
    interval,
    nextReviewDate: addDays(new Date(), interval),
    masteryLevel: determineMasteryLevel(repetitions, interval),
  };
}

function determineMasteryLevel(
  repetitions: number,
  interval: number
): MasteryLevel {
  if (repetitions === 0) {
    return "new";
  }

  if (repetitions <= 2) {
    return "learning";
  }

  if (repetitions <= 7) {
    return "reviewing";
  }

  if (repetitions >= 8 && interval >= DEFAULT_INTERVALS.mastered) {
    return "mastered";
  }

  return "reviewing";
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
