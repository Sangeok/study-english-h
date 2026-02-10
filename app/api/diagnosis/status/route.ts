import { NextResponse } from "next/server";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { hasCompleted, latestDiagnosis, canRetake, daysUntilRetake } = await checkDiagnosisStatus(session.user.id);

    return NextResponse.json({
      hasCompleted,
      cefrLevel: latestDiagnosis?.cefrLevel ?? null,
      completedAt: latestDiagnosis?.completedAt ?? null,
      canRetake,
      daysUntilRetake,
    });
  } catch (error) {
    console.error("Diagnosis status error:", error);
    return NextResponse.json({ error: "진단 상태 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
