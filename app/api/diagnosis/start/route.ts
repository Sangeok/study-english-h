import { NextResponse } from "next/server";
import { generateDiagnosisQuestions } from "@/features/diagnosis/lib/question-generator";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 기존 진단 여부 확인.
    // 차단 조건을 페이지 가드(preventDiagnosisRetake)와 동일하게 맞춘다:
    //   "이미 완료했고 + 재진단 쿨다운(30일)이 끝나지 않은 경우"에만 막는다.
    //   완료했더라도 canRetake=true 면 재진단을 허용한다(submit 은 항상 새 기록을 생성).
    const { hasCompleted, canRetake, latestDiagnosis, daysUntilRetake } =
      await checkDiagnosisStatus(session.user.id);

    if (hasCompleted && !canRetake) {
      return NextResponse.json(
        {
          error: "재진단 대기 기간입니다",
          alreadyCompleted: true,
          canRetake: false,
          daysUntilRetake,
          completedAt: latestDiagnosis?.completedAt,
          message: `재진단은 ${daysUntilRetake}일 후에 가능합니다. 그동안 퀴즈로 학습을 이어가세요!`,
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
