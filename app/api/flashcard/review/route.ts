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
import type { QualityBreakdown } from "@/features/flashcard/types";
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
    // 플래시카드는 채점이 없다 — rememberedCount 는 "잊음"을 누르지 않은 카드 수(자기평가)다.
    let rememberedCount = 0;
    const breakdown: QualityBreakdown = { easy: 0, normal: 0, hard: 0, forgot: 0 };

    for (const review of reviews) {
      // 클라이언트가 보낸 isCorrect 는 신뢰하지 않는다 — 플래시카드에는 채점이 없어
      // quality 에서 파생된 값일 뿐이다. 서버가 다시 파생해, 두 값이 어긋난 카드가
      // ("잊음"으로 집계되면서 간격은 늘어나는 상태) SRS 에 들어가는 것을 막는다.
      const remembered = review.quality !== "forgot";

      const userVocab = await recordReview(
        userId,
        review.vocabularyId,
        review.quality,
        remembered
      );

      if (remembered) {
        rememberedCount++;
      }

      breakdown[review.quality]++;

      results.push({
        vocabularyId: review.vocabularyId,
        masteryLevel: userVocab.masteryLevel,
        nextReviewDate: userVocab.nextReviewDate.toISOString(),
      });
    }

    // 리뷰 반영 완료 후 프로필 어휘 통계를 1회만 재계산 (멱등 — DB 전체 상태 기준)
    await updateProfileStats(userId);

    // 4. Calculate session statistics
    //    retention = 회상률(잊지 않은 비율). SRS 내부 지표이며 정답률이 아니다 —
    //    FlashcardSession.accuracy 컬럼 이름은 스키마 호환을 위해 유지하되 사용자에게 노출하지 않는다.
    const totalReviews = reviews.length; // reviewRequestSchema 가 min(1) 보장
    const retention = (rememberedCount / totalReviews) * 100;

    // 5-7. FlashcardSession 생성 + UserProfile 업데이트를 단일 트랜잭션으로 처리
    const xpEarned = rememberedCount * 5;
    const streakData = await getStreakUpdateData(userId);

    await prisma.$transaction(async (tx) => {
      await tx.flashcardSession.create({
        data: {
          userId,
          mode,
          vocabularyCount: totalReviews,
          accuracy: retention,
          duration,
          easyCount: breakdown.easy,
          normalCount: breakdown.normal,
          hardCount: breakdown.hard,
          forgotCount: breakdown.forgot,
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
      correctCount: rememberedCount,
      totalCount: totalReviews,
      // type === "flashcard" 이므로 정확도 배지 판정에서는 무시된다(자기평가라 근거가 될 수 없음).
      accuracy: retention,
      currentStreak: streakData.currentStreak,
    });

    // 8. Return success response with summary
    //    정답률은 내려보내지 않는다 — 플래시카드에는 채점이 없다.
    return NextResponse.json({
      success: true,
      summary: {
        total: totalReviews,
        remembered: rememberedCount,
        xpEarned,
        breakdown,
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
