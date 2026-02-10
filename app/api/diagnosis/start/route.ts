import { NextResponse } from "next/server";
import { generateDiagnosisQuestions } from "@/features/diagnosis/lib";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 기존 진단 여부 확인
    const { hasCompleted, latestDiagnosis } = await checkDiagnosisStatus(session.user.id);

    if (hasCompleted) {
      return NextResponse.json(
        {
          error: "진단이 이미 완료되었습니다",
          alreadyCompleted: true,
          completedAt: latestDiagnosis?.completedAt,
          message: "진단은 이미 완료되었습니다. 퀴즈를 이용해보세요!"
        },
        { status: 409 }
      );
    }

    const questions = await generateDiagnosisQuestions();

    return NextResponse.json({
      questions,
      totalQuestions: questions.length,
      timeLimit: 300,
    });
  } catch (error) {
    console.error("Diagnosis start error:", error);
    return NextResponse.json({ error: "진단 문제 생성 중 오류가 발생했습니다" }, { status: 500 });
  }
}
