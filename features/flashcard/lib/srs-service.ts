/**
 * SRS Service Layer
 *
 * Business logic for vocabulary spaced repetition system.
 * Handles vocabulary retrieval, review recording, and statistics updates.
 */

import prisma from "@/lib/db";
import { Vocabulary, UserVocabulary } from "@/lib/generated/prisma/client";
import { calculateNextReview, isReviewDue, type ReviewQuality, type MasteryLevel } from "./srs-algorithm";

// Extended vocabulary with user progress
export interface VocabularyWithProgress extends Vocabulary {
  userProgress?: UserVocabulary | null;
}

/**
 * Get vocabularies that are due for review
 *
 * @param userId - User ID
 * @param limit - Maximum number of vocabularies to return
 * @returns Array of vocabularies due for review
 */
export async function getDueVocabularies(
  userId: string,
  limit: number = 20
): Promise<VocabularyWithProgress[]> {
  const now = new Date();

  // Find user vocabularies where nextReviewDate <= now
  const userVocabularies = await prisma.userVocabulary.findMany({
    where: {
      userId,
      nextReviewDate: {
        lte: now,
      },
    },
    include: {
      vocabulary: true,
    },
    orderBy: {
      nextReviewDate: "asc", // Oldest due first
    },
    take: limit,
  });

  // Map to VocabularyWithProgress format
  return userVocabularies.map((uv) => ({
    ...uv.vocabulary,
    userProgress: uv,
  }));
}

/**
 * Get new vocabularies that user hasn't learned yet
 *
 * @param userId - User ID
 * @param level - CEFR level (A1-C2)
 * @param limit - Maximum number of vocabularies to return
 * @returns Array of new vocabularies matching user's level
 */
export async function getNewVocabularies(
  userId: string,
  level: string,
  limit: number = 20
): Promise<VocabularyWithProgress[]> {
  // Get all vocabulary IDs the user has already started learning
  const learnedVocabIds = await prisma.userVocabulary.findMany({
    where: { userId },
    select: { vocabularyId: true },
  });

  const learnedIds = learnedVocabIds.map((v) => v.vocabularyId);

  // Find vocabularies user hasn't learned yet, matching their level
  const vocabularies = await prisma.vocabulary.findMany({
    where: {
      level,
      id: {
        notIn: learnedIds,
      },
    },
    take: limit,
    orderBy: {
      createdAt: "asc", // Oldest first for consistent progression
    },
  });

  return vocabularies.map((vocab) => ({
    ...vocab,
    userProgress: null,
  }));
}

/**
 * Record a vocabulary review and update SRS parameters
 *
 * @param userId - User ID
 * @param vocabularyId - Vocabulary ID
 * @param quality - Review quality rating
 * @param isCorrect - Whether the answer was correct
 * @returns Updated user vocabulary record
 */
export async function recordReview(
  userId: string,
  vocabularyId: string,
  quality: ReviewQuality,
  isCorrect: boolean
): Promise<UserVocabulary> {
  // Get current user vocabulary record or create new one
  let userVocab = await prisma.userVocabulary.findUnique({
    where: {
      userId_vocabularyId: {
        userId,
        vocabularyId,
      },
    },
  });

  // Build current SRS card state
  const currentCard = {
    repetitions: userVocab?.repetitions ?? 0,
    easeFactor: userVocab?.easeFactor ?? 2.5,
    interval: userVocab?.interval ?? 1,
    lastReviewDate: userVocab?.lastReviewDate ?? null,
    masteryLevel: (userVocab?.masteryLevel as MasteryLevel) ?? "new",
  };

  // Calculate next review using SM-2 algorithm
  const result = calculateNextReview(currentCard, quality, isCorrect);

  // Upsert user vocabulary record
  const updatedUserVocab = await prisma.userVocabulary.upsert({
    where: {
      userId_vocabularyId: {
        userId,
        vocabularyId,
      },
    },
    create: {
      userId,
      vocabularyId,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval,
      lastReviewDate: new Date(),
      nextReviewDate: result.nextReviewDate,
      masteryLevel: result.masteryLevel,
      totalReviews: 1,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
    },
    update: {
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval,
      lastReviewDate: new Date(),
      nextReviewDate: result.nextReviewDate,
      masteryLevel: result.masteryLevel,
      totalReviews: {
        increment: 1,
      },
      correctCount: isCorrect
        ? {
            increment: 1,
          }
        : undefined,
      incorrectCount: !isCorrect
        ? {
            increment: 1,
          }
        : undefined,
    },
  });

  // Update user profile statistics
  await updateProfileStats(userId);

  return updatedUserVocab;
}

/**
 * Update user profile statistics based on vocabulary progress
 *
 * @param userId - User ID
 */
export async function updateProfileStats(userId: string): Promise<void> {
  // Count vocabularies by mastery level
  const stats = await prisma.userVocabulary.groupBy({
    by: ["masteryLevel"],
    where: { userId },
    _count: true,
  });

  // Calculate statistics
  let totalWordLearned = 0;
  let masteredWords = 0;

  for (const stat of stats) {
    totalWordLearned += stat._count;

    if (stat.masteryLevel === "mastered") {
      masteredWords += stat._count;
    }
  }

  // Count vocabularies due for review
  const reviewNeeded = await prisma.userVocabulary.count({
    where: {
      userId,
      nextReviewDate: {
        lte: new Date(),
      },
    },
  });

  // Update user profile
  await prisma.userProfile.update({
    where: { userId },
    data: {
      totalWordLearned,
      masteredWords,
      reviewNeeded,
    },
  });
}

/**
 * Get user's vocabulary statistics
 *
 * @param userId - User ID
 * @returns Statistics object with mastery level breakdown
 */
export async function getVocabularyStats(
  userId: string
): Promise<{ byMasteryLevel: Record<string, number>; dueForReview: number }> {
  const stats = await prisma.userVocabulary.groupBy({
    by: ["masteryLevel"],
    where: { userId },
    _count: true,
  });

  const dueCount = await prisma.userVocabulary.count({
    where: {
      userId,
      nextReviewDate: {
        lte: new Date(),
      },
    },
  });

  return {
    byMasteryLevel: stats.reduce(
      (acc, stat) => {
        acc[stat.masteryLevel] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    dueForReview: dueCount,
  };
}
