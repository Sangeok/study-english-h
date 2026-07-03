/**
 * Flashcard Review Submission API
 *
 * POST /api/flashcard/review
 * Body: { reviews: ReviewEntry[], mode: string, duration: number }
 *
 * Processes bulk review submissions, updates SRS parameters,
 * creates session record, and awards XP.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStreakUpdateData } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { recordReview, updateProfileStats } from "@/features/flashcard/lib/srs-service";
import { reviewRequestSchema } from "@/features/flashcard/lib/srs-validation";
import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = reviewRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reviews, mode, duration } = validation.data;

    // 3. Process each review
    const results = [];
    let correctCount = 0;
    let easyCount = 0;
    let normalCount = 0;
    let hardCount = 0;
    let forgotCount = 0;

    for (const review of reviews) {
      const userVocab = await recordReview(
        userId,
        review.vocabularyId,
        review.quality,
        review.isCorrect
      );

      if (review.isCorrect) {
        correctCount++;
      }

      switch (review.quality) {
        case "easy": easyCount++; break;
        case "normal": normalCount++; break;
        case "hard": hardCount++; break;
        case "forgot": forgotCount++; break;
      }

      results.push({
        vocabularyId: review.vocabularyId,
        masteryLevel: userVocab.masteryLevel,
        nextReviewDate: userVocab.nextReviewDate.toISOString(),
      });
    }

    // 리뷰 반영 완료 후 프로필 어휘 통계를 1회만 재계산 (멱등 — DB 전체 상태 기준)
    await updateProfileStats(userId);

    // 4. Calculate session statistics
    const totalReviews = reviews.length;
    const accuracy = (correctCount / totalReviews) * 100;

    // 5-7. FlashcardSession 생성 + UserProfile 업데이트를 단일 트랜잭션으로 처리
    const xpEarned = correctCount * 5;
    const streakData = await getStreakUpdateData(userId);

    await prisma.$transaction(async (tx) => {
      await tx.flashcardSession.create({
        data: {
          userId,
          mode,
          vocabularyCount: totalReviews,
          accuracy,
          duration,
          easyCount,
          normalCount,
          hardCount,
          forgotCount,
        },
      });

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          totalXP: xpEarned,
          spendableXP: xpEarned,
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
        update: {
          totalXP: { increment: xpEarned },
          spendableXP: { increment: xpEarned },
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          freezeCount: streakData.newFreezeCount,
        },
      });
    });

    const gamificationResult = await processGamificationRewards(userId, {
      type: "flashcard",
      correctCount,
      totalCount: totalReviews,
      accuracy,
      currentStreak: streakData.currentStreak,
    });

    // 8. Return success response with summary
    return NextResponse.json({
      success: true,
      summary: {
        total: totalReviews,
        correct: correctCount,
        accuracy: Math.round(accuracy * 10) / 10,
        xpEarned,
      },
      results,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error("Flashcard review API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
