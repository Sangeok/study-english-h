import { NextResponse } from "next/server";
import { generateDiagnosisQuestions } from "@/features/diagnosis/lib/question-generator";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    // 게스트(미인증)도 진단 체험을 허용한다. 인증 사용자는 기존 재진단 쿨다운 체크 유지.
    //   차단 조건은 페이지 가드(preventDiagnosisRetake)와 동일:
    //   "이미 완료했고 + 재진단 쿨다운(30일)이 끝나지 않은 경우"에만 막는다.
    //   문항 생성 자체는 userId 무관이라 게스트·인증 공통.
    if (session?.user?.id) {
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
