import type { DiagnosisAnswer, DiagnosisQuestion } from "@/entities/question";

export function formatDiagnosisAnswers(
  questions: DiagnosisQuestion[],
  answersById: Record<string, string>
): DiagnosisAnswer[] {
  return questions.map((question) => ({
    questionId: question.id,
    difficulty: question.difficulty,
    isCorrect:
      question.options.find((option) => option.isCorrect)?.text ===
      answersById[question.id],
    category: question.category,
  }));
}
