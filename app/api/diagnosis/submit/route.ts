import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateDiagnosisScore } from "@/features/diagnosis/lib/scoring";
import { diagnosisSubmitRequestSchema } from "@/entities/question/lib/schemas";
import { getStreakUpdateData } from "@/entities/user";
import { getSessionFromRequest } from "@/shared/lib/get-session";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const validation = diagnosisSubmitRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "잘못된 진단 제출 요청입니다", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { answers } = validation.data;
    const userId = session.user.id;

    // 점수 계산
    const result = calculateDiagnosisScore(answers);

    const weaknessAreaMap = result.weaknessAreas.reduce((acc, area) => {
      acc[area.category] = area.accuracy;
      return acc;
    }, {} as Record<string, number>);

    // streak 데이터 선행 조회
    const streakData = await getStreakUpdateData(userId);

    // 진단 결과 저장 + UserProfile upsert 병렬 실행
    const [diagnosis] = await Promise.all([
      prisma.levelDiagnosis.create({
        data: {
          userId,
          totalScore: result.totalScore,
          cefrLevel: result.cefrLevel,
          weaknessAreas: {
            create: result.weaknessAreas.map((area) => ({
              category: area.category,
              accuracy: area.accuracy,
            })),
          },
        },
        include: {
          weaknessAreas: true,
        },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          level: result.cefrLevel,
          weaknessAreas: weaknessAreaMap,
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
        },
        update: {
          level: result.cefrLevel,
          weaknessAreas: weaknessAreaMap,
          lastStudyDate: streakData.lastStudyDate,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
        },
      }),
    ]);

    return NextResponse.json({
      diagnosisId: diagnosis.id,
      totalScore: result.totalScore,
      cefrLevel: result.cefrLevel,
      weaknessAreas: result.weaknessAreas,
      recommendedStartPoint: result.recommendedStartPoint,
    });
  } catch (error) {
    console.error("Diagnosis submit error:", error);
    return NextResponse.json({ error: "진단 제출 중 오류가 발생했습니다" }, { status: 500 });
  }
}
