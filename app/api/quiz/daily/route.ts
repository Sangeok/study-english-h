import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { QuestionCategory, QuestionDifficulty } from "@/entities/question";
import { questionCategorySchema, questionDifficultySchema } from "@/entities/question/lib/schemas";
import { DEFAULT_QUIZ_COUNT, WEAKNESS_QUESTION_RATIO } from "@/shared/constants";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { shuffleArray } from "@/shared/lib";

const QUESTION_INCLUDE = {
  options: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.QuizQuestionInclude;

type QuizQuestionWithOptions = Prisma.QuizQuestionGetPayload<{
  include: typeof QUESTION_INCLUDE;
}>;

type QuestionQueryOptions = {
  difficulty: QuestionDifficulty;
  take: number;
  includeCategories?: readonly QuestionCategory[];
  excludeCategories?: readonly QuestionCategory[];
  excludeQuestionIds?: readonly string[];
};

function getQuizCount(searchParams: URLSearchParams): number {
  const rawCount = searchParams.get("count");

  if (!rawCount) {
    return DEFAULT_QUIZ_COUNT;
  }

  const parsedCount = Number(rawCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    return DEFAULT_QUIZ_COUNT;
  }

  return parsedCount;
}

function getUserLevel(level: string | null | undefined): QuestionDifficulty {
  const result = questionDifficultySchema.safeParse(level);

  if (!result.success) {
    return "A1";
  }

  return result.data;
}

function getWeaknessCategories(weaknessAreas: unknown): QuestionCategory[] {
  if (!isPlainObject(weaknessAreas)) {
    return [];
  }

  return Object.keys(weaknessAreas).flatMap((category) => {
    const result = questionCategorySchema.safeParse(category);

    if (!result.success) {
      return [];
    }

    return [result.data];
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getRandomQuestions({
  difficulty,
  take,
  includeCategories,
  excludeCategories,
  excludeQuestionIds,
}: QuestionQueryOptions): Promise<QuizQuestionWithOptions[]> {
  if (take <= 0) {
    return [];
  }

  const questions = await prisma.quizQuestion.findMany({
    where: {
      difficulty,
      ...(includeCategories && includeCategories.length > 0
        ? {
            category: {
              in: [...includeCategories],
            },
          }
        : {}),
      ...(excludeCategories && excludeCategories.length > 0
        ? {
            category: {
              notIn: [...excludeCategories],
            },
          }
        : {}),
      ...(excludeQuestionIds && excludeQuestionIds.length > 0
        ? {
            id: {
              notIn: [...excludeQuestionIds],
            },
          }
        : {}),
    },
    include: QUESTION_INCLUDE,
    take: take * 2,
  });

  return shuffleArray(questions).slice(0, take);
}

function createQuizQuestionResponse(question: QuizQuestionWithOptions) {
  return {
    id: question.id,
    koreanHint: question.koreanHint,
    contextHint: question.contextHintKo ?? null,
    sentence: question.sentence,
    difficulty: question.difficulty,
    category: question.category,
    options: question.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  };
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const count = getQuizCount(searchParams);

    const [{ hasCompleted }, profile] = await Promise.all([
      checkDiagnosisStatus(session.user.id),
      prisma.userProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    if (!hasCompleted) {
      return NextResponse.json(
        {
          error: "Diagnosis required",
          requiresDiagnosis: true,
          message: "Complete the diagnosis before starting the quiz.",
        },
        { status: 403 }
      );
    }

    const userLevel = getUserLevel(profile?.level);
    const weaknessCategories = getWeaknessCategories(profile?.weaknessAreas);

    const weaknessCount =
      weaknessCategories.length > 0
        ? Math.floor(count * WEAKNESS_QUESTION_RATIO)
        : 0;

    const selectedWeaknessQuestions = await getRandomQuestions({
      difficulty: userLevel,
      includeCategories: weaknessCategories,
      take: weaknessCount,
    });

    const remainingCount = Math.max(count - selectedWeaknessQuestions.length, 0);
    const selectedNormalQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeCategories: weaknessCategories,
      excludeQuestionIds: selectedWeaknessQuestions.map((question) => question.id),
      take: remainingCount,
    });

    const selectedQuestionIds = [
      ...selectedWeaknessQuestions,
      ...selectedNormalQuestions,
    ].map((question) => question.id);

    const fallbackCount = Math.max(count - selectedQuestionIds.length, 0);
    const fallbackQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeQuestionIds: selectedQuestionIds,
      take: fallbackCount,
    });

    const questions = shuffleArray([
      ...selectedWeaknessQuestions,
      ...selectedNormalQuestions,
      ...fallbackQuestions,
    ]).slice(0, count);

    return NextResponse.json({
      questions: questions.map(createQuizQuestionResponse),
      userLevel,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
