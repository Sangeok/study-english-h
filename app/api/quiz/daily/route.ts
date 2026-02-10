import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkDiagnosisStatus, getSessionFromRequest } from "@/shared/lib";
import { DEFAULT_QUIZ_COUNT, WEAKNESS_QUESTION_RATIO } from "@/shared/constants";
import { shuffleArray } from "@/shared/utils";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get("count") || DEFAULT_QUIZ_COUNT.toString());

    // 진단 완료 여부 확인 + 사용자 프로필 병렬 조회
    const [{ hasCompleted }, profile] = await Promise.all([
      checkDiagnosisStatus(session.user.id),
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    if (!hasCompleted) {
      return NextResponse.json(
        {
          error: "진단이 필요합니다",
          requiresDiagnosis: true,
          message: "퀴즈를 이용하려면 먼저 레벨 진단을 완료해주세요",
        },
        { status: 403 }
      );
    }

    // 프로필이 없으면 기본 A1 레벨로 문제 생성
    const userLevel = profile?.level ?? "A1";

    // 약점 영역 기반 문제 선택 (50% 약점, 50% 일반)
    const weaknessCategories = profile?.weaknessAreas
      ? Object.keys(profile.weaknessAreas as Record<string, number>)
      : [];

    const weaknessCount = weaknessCategories.length > 0 ? Math.floor(count * WEAKNESS_QUESTION_RATIO) : 0;
    const normalCount = count - weaknessCount;

    let questions = [];

    // 약점 영역 문제
    if (weaknessCount > 0) {
      const weaknessQuestions = await prisma.quizQuestion.findMany({
        where: {
          difficulty: userLevel,
          category: { in: weaknessCategories },
        },
        include: {
          options: { orderBy: { order: "asc" } },
        },
        take: weaknessCount * 2,
      });
      questions.push(...shuffleArray(weaknessQuestions).slice(0, weaknessCount));
    }

    // 일반 문제
    const normalQuestions = await prisma.quizQuestion.findMany({
      where: {
        difficulty: userLevel,
        ...(weaknessCategories.length > 0 && {
          category: { notIn: weaknessCategories },
        }),
      },
      include: {
        options: { orderBy: { order: "asc" } },
      },
      take: normalCount * 2,
    });
    questions.push(...shuffleArray(normalQuestions).slice(0, normalCount));

    questions = shuffleArray(questions);

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        koreanHint: q.koreanHint,
        contextHint: q.contextHintKo ?? null,
        sentence: q.sentence,
        difficulty: q.difficulty,
        category: q.category,
        options: q.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      })),
      userLevel,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "퀴즈 생성 중 오류가 발생했습니다" }, { status: 500 });
  }
}
