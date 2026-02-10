/**
 * Flashcard Session API
 *
 * GET /api/flashcard/session?mode=review&limit=20
 *
 * Fetches vocabularies for a flashcard session based on mode:
 * - review: Get due vocabularies for review
 * - new: Get new vocabularies to learn
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { getDueVocabularies, getNewVocabularies } from "@/features/flashcard/lib/srs-service";
import { sessionQuerySchema } from "@/features/flashcard/lib/srs-validation";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
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

    // 2. Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const modeParam = searchParams.get("mode") || "review";
    const limitParam = Number(searchParams.get("limit")) || 20;

    const validation = sessionQuerySchema.safeParse({
      mode: modeParam,
      limit: limitParam,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { mode, limit } = validation.data;

    // 3. Get user profile for level information
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // 4. Fetch vocabularies based on mode
    let vocabularies;
    if (mode === "review") {
      vocabularies = await getDueVocabularies(userId, limit);
    } else {
      // mode === "new"
      vocabularies = await getNewVocabularies(userId, userProfile.level, limit);
    }

    // 5. Map to response format
    const response = vocabularies.map((vocab) => ({
      id: vocab.id,
      word: vocab.word,
      meaning: vocab.meaning,
      pronunciation: vocab.pronunciation || undefined,
      exampleSentence: vocab.exampleSentence || undefined,
      audioUrl: vocab.audioUrl || undefined,
      masteryLevel: vocab.userProgress?.masteryLevel || "new",
      nextReviewDate: vocab.userProgress?.nextReviewDate?.toISOString() || new Date().toISOString(),
    }));

    // 6. Return response
    return NextResponse.json({
      vocabularies: response,
      mode,
      count: response.length,
    });
  } catch (error) {
    console.error("Flashcard session API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
