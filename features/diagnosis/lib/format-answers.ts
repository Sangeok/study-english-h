import type { Prisma } from "@/lib/generated/prisma/client";
import type { DiagnosisAnswer, DiagnosisSubmitAnswer } from "@/entities/question";

type DbQuestionWithOptions = Prisma.QuizQuestionGetPayload<{
  include: { options: true };
}>;

/**
 * 서버 전용 — 클라이언트에서 import 금지.
 *
 * DB 재조회한 문항 데이터를 기준으로 채점한다.
 * difficulty · category · isCorrect 는 모두 DB 값만 사용하며,
 * submitted 객체의 어떤 필드도 채점 경로에서 읽지 않는다.
 */
export function formatDiagnosisAnswers(
  dbQuestions: DbQuestionWithOptions[],
  submitAnswers: DiagnosisSubmitAnswer[]
): DiagnosisAnswer[] {
  const questionById = new Map(dbQuestions.map((q) => [q.id, q]));
  return submitAnswers.map((submitted) => {
    const dbQuestion = questionById.get(submitted.questionId);
    if (!dbQuestion) {
      // 라우트에서 길이 검증으로 사전 차단되지만 방어적 이중 체크.
      throw new Error(`Unknown questionId: ${submitted.questionId}`);
    }
    const correctOption = dbQuestion.options.find((o) => o.isCorrect);
    return {
      questionId: dbQuestion.id,
      difficulty: dbQuestion.difficulty as DiagnosisAnswer["difficulty"],
      category: dbQuestion.category as DiagnosisAnswer["category"],
      // 빈 selectedText 는 correctOption.text 와 매칭되지 않으므로 자연히 false.
      isCorrect: correctOption?.text === submitted.selectedText,
    };
  });
}
