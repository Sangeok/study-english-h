import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { QuestionCategory, QuestionDifficulty } from "@/entities/question";
import { questionCategorySchema } from "@/entities/question/lib/schemas";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import {
  DEFAULT_QUIZ_COUNT,
  WEAKNESS_QUESTION_RATIO,
  RECENT_EXCLUSION_RATIO,
  RECENT_EXCLUSION_MAX,
} from "@/shared/constants";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { shuffleArray } from "@/shared/lib";
import { getTodayKSTRange } from "@/entities/user/lib/streak";

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
  const result = cefrLevelSchema.safeParse(level);

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

// Fix 1: 콘텐츠 기반 중복 제거 — DB에 동일 englishWord가 다른 ID로 중복 저장된 경우 방어
function deduplicateByContent(
  questions: QuizQuestionWithOptions[]
): QuizQuestionWithOptions[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (seen.has(q.englishWord)) return false;
    seen.add(q.englishWord);
    return true;
  });
}

// Fix 3: take 제한 제거 — 전체 후보 조회 후 JS 셔플로 편향 없는 랜덤화
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
    // Phase 0-A: isCorrect 제거 — 클라이언트에 정답 노출 차단
    // Phase 0-B: shuffleArray 로 응답 시점 셔플 — position 암기 exploit 차단
    options: shuffleArray(question.options).map((option) => ({
      text: option.text,
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

    const [{ hasCompleted }, profile, todayAttemptCount] = await Promise.all([
      checkDiagnosisStatus(session.user.id),
      prisma.userProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
      prisma.userQuizAttempt.count({
        where: {
          userId: session.user.id,
          attemptedAt: getTodayKSTRange(),
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

    // Fix 4: 비율 기반 sliding window — 최근 풀이 문제 제외
    const poolSize = await prisma.quizQuestion.count({
      where: { difficulty: userLevel },
    });

    const windowSize = Math.min(
      Math.floor(poolSize * RECENT_EXCLUSION_RATIO),
      RECENT_EXCLUSION_MAX
    );

    const recentAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId: session.user.id },
      select: { questionId: true },
      distinct: ["questionId"],
      orderBy: { attemptedAt: "desc" },
      take: windowSize,
    });
    const recentQuestionIds = recentAttempts.map((a) => a.questionId);

    const weaknessCount =
      weaknessCategories.length > 0
        ? Math.floor(count * WEAKNESS_QUESTION_RATIO)
        : 0;

    const selectedWeaknessQuestions = await getRandomQuestions({
      difficulty: userLevel,
      includeCategories: weaknessCategories,
      excludeQuestionIds: recentQuestionIds,
      take: weaknessCount,
    });

    const remainingCount = Math.max(count - selectedWeaknessQuestions.length, 0);
    const selectedNormalQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeCategories: weaknessCategories,
      excludeQuestionIds: [
        ...recentQuestionIds,
        ...selectedWeaknessQuestions.map((question) => question.id),
      ],
      take: remainingCount,
    });

    const selectedQuestionIds = [
      ...selectedWeaknessQuestions,
      ...selectedNormalQuestions,
    ].map((question) => question.id);

    const fallbackCount = Math.max(count - selectedQuestionIds.length, 0);
    const fallbackQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeQuestionIds: [...recentQuestionIds, ...selectedQuestionIds],
      take: fallbackCount,
    });

    // Fix 1: 콘텐츠 중복 제거 후 slice
    const questions = deduplicateByContent(
      shuffleArray([
        ...selectedWeaknessQuestions,
        ...selectedNormalQuestions,
        ...fallbackQuestions,
      ])
    ).slice(0, count);

    // Fix 4: 풀 고갈 시 recentQuestionIds 제외 없이 재시도 (세션 내 ID 중복만 방지)
    if (questions.length < count) {
      const emergencyFallback = await getRandomQuestions({
        difficulty: userLevel,
        excludeQuestionIds: questions.map((q) => q.id),
        take: count - questions.length,
      });
      questions.push(...emergencyFallback);
    }

    const hasCompletedToday = todayAttemptCount > 0;

    return NextResponse.json({
      questions: questions.map(createQuizQuestionResponse),
      userLevel,
      totalQuestions: questions.length,
      hasCompletedToday,
      // 추가 연습(isExtraPractice) 모드에서는 서버가 프리 힌트를 소비하지 않으므로
      // 클라이언트 미리보기도 낙관적 상쇄를 꺼야 한다. 그래서 0으로 내려보낸다.
      freeHintCount: hasCompletedToday ? 0 : profile?.freeHintCount ?? 0,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
