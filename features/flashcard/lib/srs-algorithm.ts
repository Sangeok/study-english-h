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
    easeFactor = Math.max(1.3, easeFactor - 0.2);

    return {
      repetitions,
      easeFactor,
      interval,
      nextReviewDate: addDays(new Date(), interval),
      masteryLevel: "new",
    };
  }

  repetitions += 1;
  const efAdjustment = getEaseFactorAdjustment(quality);
  easeFactor = Math.max(1.3, easeFactor + efAdjustment);

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

function getEaseFactorAdjustment(quality: ReviewQuality): number {
  switch (quality) {
    case "easy":
      return 0.15;
    case "normal":
      return 0.0;
    case "hard":
      return -0.15;
    case "forgot":
      return -0.2;
  }
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

export function isReviewDue(nextReviewDate: Date): boolean {
  return nextReviewDate <= new Date();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
