/**
 * SM-2 Algorithm Implementation for Spaced Repetition System
 *
 * Core principles:
 * - Interval progression: 1d → 3d → 7d → easeFactor multiplication
 * - EaseFactor adjustments based on review quality
 * - Mastery level progression based on repetitions and intervals
 */

// Mastery levels
export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

// Review quality ratings
export type ReviewQuality = "forgot" | "hard" | "normal" | "easy";

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

// Default intervals for each mastery level
const DEFAULT_INTERVALS = {
  new: 1,
  learning: 3,
  reviewing: 7,
  mastered: 180,
};

/**
 * Calculate next review date and update SRS parameters based on SM-2 algorithm
 *
 * @param card - Current SRS card state
 * @param quality - Review quality rating from user
 * @param isCorrect - Whether the answer was correct
 * @returns Updated SRS parameters with next review date
 */
export function calculateNextReview(
  card: SRSCard,
  quality: ReviewQuality,
  isCorrect: boolean
): SRSResult {
  let { repetitions, easeFactor, interval } = card;

  // Handle incorrect answers - reset progress
  if (!isCorrect) {
    repetitions = 0;
    interval = DEFAULT_INTERVALS.new; // Reset to 1 day
    easeFactor = Math.max(1.3, easeFactor - 0.2); // Decrease EF, minimum 1.3

    return {
      repetitions,
      easeFactor,
      interval,
      nextReviewDate: addDays(new Date(), interval),
      masteryLevel: "new",
    };
  }

  // Handle correct answers
  repetitions += 1;

  // Adjust ease factor based on quality
  const efAdjustment = getEaseFactorAdjustment(quality);
  easeFactor = Math.max(1.3, easeFactor + efAdjustment);

  // Calculate next interval based on repetitions
  if (repetitions === 1) {
    interval = DEFAULT_INTERVALS.new; // 1 day
  } else if (repetitions === 2) {
    interval = DEFAULT_INTERVALS.learning; // 3 days
  } else if (repetitions === 3) {
    interval = DEFAULT_INTERVALS.reviewing; // 7 days
  } else {
    // After 3rd repetition, multiply by easeFactor
    interval = Math.round(interval * easeFactor);
  }

  // Determine mastery level
  const masteryLevel = determineMasteryLevel(repetitions, interval);

  return {
    repetitions,
    easeFactor,
    interval,
    nextReviewDate: addDays(new Date(), interval),
    masteryLevel,
  };
}

/**
 * Get ease factor adjustment based on review quality
 */
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

/**
 * Determine mastery level based on repetitions and interval
 *
 * Progression:
 * - new: 0 repetitions
 * - learning: 1-2 repetitions
 * - reviewing: 3-7 repetitions
 * - mastered: 8+ repetitions AND 180+ days interval
 */
function determineMasteryLevel(
  repetitions: number,
  interval: number
): MasteryLevel {
  if (repetitions === 0) {
    return "new";
  } else if (repetitions <= 2) {
    return "learning";
  } else if (repetitions <= 7) {
    return "reviewing";
  } else if (repetitions >= 8 && interval >= DEFAULT_INTERVALS.mastered) {
    return "mastered";
  } else {
    return "reviewing";
  }
}

/**
 * Check if a vocabulary is due for review
 *
 * @param nextReviewDate - The scheduled next review date
 * @returns true if review is due (nextReviewDate <= now)
 */
export function isReviewDue(nextReviewDate: Date): boolean {
  return nextReviewDate <= new Date();
}

/**
 * Add days to a date
 *
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
