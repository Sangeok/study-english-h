import prisma from "@/lib/db";
import type { DiagnosisQuestion } from "@/entities/question";
import { shuffleArray } from "@/shared/utils";

export async function generateDiagnosisQuestions(): Promise<DiagnosisQuestion[]> {
  const distribution = [
    { level: "A1", count: 6 },
    { level: "A2", count: 5 },
    { level: "B1", count: 4 },
    { level: "B2", count: 3 },
    { level: "C1", count: 2 },
  ];

  const questions: DiagnosisQuestion[] = [];

  for (const { level, count } of distribution) {
    const levelQuestions = await prisma.quizQuestion.findMany({
      where: { difficulty: level },
      include: {
        options: { orderBy: { order: "asc" } },
      },
      take: count * 2, // 풀을 넉넉히 가져와서 랜덤 선택
      orderBy: { createdAt: "desc" },
    });

    const selected = shuffleArray(levelQuestions).slice(0, count);

    questions.push(
      ...selected.map((q) => ({
        id: q.id,
        koreanHint: q.koreanHint,
        englishWord: q.englishWord,
        sentence: q.sentence,
        difficulty: q.difficulty,
        category: q.category,
        options: q.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      }))
    );
  }

  return shuffleArray(questions);
}
