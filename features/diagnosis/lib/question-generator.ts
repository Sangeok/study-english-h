import prisma from "@/lib/db";
import type { DiagnosisQuestion } from "@/entities/question";
import { shuffleArray } from "@/shared/lib";
import { QUESTION_DISTRIBUTION, QUESTION_POOL_MULTIPLIER } from "../constants";

export async function generateDiagnosisQuestions(): Promise<DiagnosisQuestion[]> {
  const levelResults = await Promise.all(
    QUESTION_DISTRIBUTION.map(({ level, count }) =>
      prisma.quizQuestion
        .findMany({
          where: { difficulty: level },
          include: {
            options: { orderBy: { order: "asc" } },
          },
          take: count * QUESTION_POOL_MULTIPLIER,
          orderBy: { createdAt: "desc" },
        })
        .then((rows) => ({ rows, count }))
    )
  );

  const questions: DiagnosisQuestion[] = levelResults.flatMap(
    ({ rows, count }) =>
      shuffleArray(rows)
        .slice(0, count)
        .map((q) => ({
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

  return shuffleArray(questions);
}
