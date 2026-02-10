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
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { getStreakUpdateData } from "@/shared/lib/update-streak";
import { recordReview } from "@/features/flashcard/lib/srs-service";
import { reviewRequestSchema } from "@/features/flashcard/lib/srs-validation";
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

    // 4. Calculate session statistics
    const totalReviews = reviews.length;
    const accuracy = (correctCount / totalReviews) * 100;

    // 5. Create flashcard session record
    await prisma.flashcardSession.create({
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

    // 6. Calculate and award XP (5 XP per correct answer)
    const xpEarned = correctCount * 5;

    // 7. Update user profile (XP + streak)
    const streakData = await getStreakUpdateData(userId);

    await prisma.userProfile.update({
      where: { userId },
      data: {
        totalXP: { increment: xpEarned },
        lastStudyDate: streakData.lastStudyDate,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      },
    });

    // 8. Return success response with summary
    return NextResponse.json({
      success: true,
      summary: {
        total: totalReviews,
        correct: correctCount,
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
        xpEarned,
      },
      results,
    });
  } catch (error) {
    console.error("Flashcard review API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
