import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const diagnosis = await prisma.levelDiagnosis.findUnique({
      where: { id },
      include: { weaknessAreas: true },
    });

    if (!diagnosis || diagnosis.userId !== session.user.id) {
      return NextResponse.json({ error: "진단 결과를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({
      totalScore: diagnosis.totalScore,
      cefrLevel: diagnosis.cefrLevel,
      weaknessAreas: diagnosis.weaknessAreas.map((wa) => ({
        category: wa.category,
        accuracy: wa.accuracy,
      })),
      completedAt: diagnosis.completedAt,
    });
  } catch (error) {
    console.error("Diagnosis fetch error:", error);
    return NextResponse.json({ error: "진단 결과 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
