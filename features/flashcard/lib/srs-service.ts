/**
 * SRS Service Layer
 *
 * Business logic for vocabulary spaced repetition system.
 * Handles vocabulary retrieval, review recording, and statistics updates.
 */

import prisma from "@/lib/db";
import { Vocabulary, UserVocabulary } from "@/lib/generated/prisma/client";
import { buildAdjacentPriority, type CefrLevel } from "@/shared/constants";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import type { MasteryLevel, ReviewQuality } from "../types";
import { calculateNextReview, DEFAULT_EASE_FACTOR } from "./srs-algorithm";

// 유효하지 않은 level 에 대한 보수적 기본값 — quiz route(getUserLevel)와 동일.
const DEFAULT_LEVEL: CefrLevel = "A1";

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
 * Get new vocabularies that user hasn't learned yet.
 *
 * exact level 을 먼저 채우고, 부족분만 인접 하위→상위 레벨로 확장한다(adjacent fallback, RFC §7).
 * 신규 카드 고갈 체감을 줄인다. tier 별 반복 쿼리 대신 단일 쿼리로 후보를 모으고 in-memory 우선순위 정렬한다.
 *
 * @param userId - User ID
 * @param level - CEFR level (A1-C2). 유효하지 않으면 보수적 기본값(A1)으로 정규화한다.
 * @param limit - Maximum number of vocabularies to return
 * @returns Array of new vocabularies, exact-first 우선순위 순
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

  // 레벨 정규화(RFC 7-1): 유효하지 않은 값이 adjacent index 계산을 깨뜨리지 않도록 safeParse.
  const parsed = cefrLevelSchema.safeParse(level);
  const normalizedLevel: CefrLevel = parsed.success ? parsed.data : DEFAULT_LEVEL;
  const prioritizedLevels = buildAdjacentPriority(normalizedLevel);

  // 단일 쿼리로 fallback 후보를 한 번에 가져온다. 달라지는 것은 level 조건뿐(learnedIds 는 전과 동일).
  const candidates = await prisma.vocabulary.findMany({
    where: {
      level: { in: prioritizedLevels },
      id: {
        notIn: learnedIds,
      },
    },
    orderBy: {
      createdAt: "asc", // 레벨 내 결정적 진행 순서
    },
  });

  // in-memory 우선순위 정렬 후 limit 적용. 안정 정렬이라 동일 레벨 내에서는 createdAt asc 가 보존된다.
  const rankByLevel = new Map<string, number>(
    prioritizedLevels.map((lv, i): [string, number] => [lv, i])
  );
  const ordered = [...candidates].sort(
    (a, b) =>
      (rankByLevel.get(a.level) ?? Number.MAX_SAFE_INTEGER) -
      (rankByLevel.get(b.level) ?? Number.MAX_SAFE_INTEGER)
  );

  return ordered.slice(0, limit).map((vocab) => ({
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
  const userVocab = await prisma.userVocabulary.findUnique({
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
    easeFactor: userVocab?.easeFactor ?? DEFAULT_EASE_FACTOR,
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
