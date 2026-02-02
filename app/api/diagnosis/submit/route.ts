import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateDiagnosisScore } from "@/features/diagnosis";
import type { DiagnosisAnswer } from "@/entities/question";
import { getSessionFromRequest } from "@/shared/lib";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { answers } = (await req.json()) as { answers: DiagnosisAnswer[] };
    const userId = session.user.id;

    // 점수 계산
    const result = calculateDiagnosisScore(answers);

    const weaknessAreaMap = result.weaknessAreas.reduce((acc, area) => {
      acc[area.category] = area.accuracy;
      return acc;
    }, {} as Record<string, number>);

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
        },
        update: {
          level: result.cefrLevel,
          weaknessAreas: weaknessAreaMap,
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
