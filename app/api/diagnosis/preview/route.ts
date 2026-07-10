import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { formatDiagnosisAnswers } from "@/features/diagnosis/lib/format-answers";
import { calculateDiagnosisScore } from "@/features/diagnosis/lib/scoring";
import { diagnosisSubmitRequestSchema } from "@/entities/question/lib/schemas";
import { MIN_DIAGNOSIS_ANSWERS } from "@/shared/constants";

/**
 * 게스트 진단 채점 (무인증, 미저장).
 *
 * 인증 submit(app/api/diagnosis/submit/route.ts)과 검증을 완전히 동일하게 맞춘다 —
 * 스키마·MIN·미존재 questionId 체크를 그대로 재현. 그래야 게스트가 preview로 결과를 본 뒤
 * 가입 후 같은 답변을 submit으로 재전송할 때 400 저장 실패가 없다.
 * 차이는 인증 없음·영속화 없음·게임화 없음뿐.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = diagnosisSubmitRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "잘못된 진단 제출 요청입니다", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { answers } = validation.data;

    const answeredCount = answers.filter((a) => a.selectedText.trim() !== "").length;
    if (answeredCount < MIN_DIAGNOSIS_ANSWERS) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_ANSWERS",
          message: `최소 ${MIN_DIAGNOSIS_ANSWERS}개 문항에 답해야 진단이 완료됩니다`,
          answeredCount,
          requiredCount: MIN_DIAGNOSIS_ANSWERS,
        },
        { status: 400 }
      );
    }

    const questionIds = answers.map((a) => a.questionId);
    const dbQuestions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    if (dbQuestions.length !== answers.length) {
      return NextResponse.json(
        { error: "존재하지 않는 questionId 가 포함되어 있습니다" },
        { status: 400 }
      );
    }

    const scoredAnswers = formatDiagnosisAnswers(dbQuestions, answers);
    const result = calculateDiagnosisScore(scoredAnswers);

    // submit 응답과 동일 필드(diagnosisId·gamification 제외) — 게스트 결과 뷰가 그대로 소비.
    return NextResponse.json({
      totalScore: result.totalScore,
      cefrLevel: result.cefrLevel,
      weaknessAreas: result.weaknessAreas,
      recommendedStartPoint: result.recommendedStartPoint,
    });
  } catch (error) {
    console.error("Diagnosis preview error:", error);
    return NextResponse.json({ error: "진단 채점 중 오류가 발생했습니다" }, { status: 500 });
  }
}
