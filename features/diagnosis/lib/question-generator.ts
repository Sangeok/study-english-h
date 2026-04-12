import prisma from "@/lib/db";
import type { DiagnosisQuestion } from "@/entities/question";
import { shuffleArray } from "@/shared/lib";
import { QUESTION_DISTRIBUTION, QUESTION_POOL_MULTIPLIER } from "../config";

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
          // Phase 0-A: isCorrect 제거 — 클라이언트에 정답 노출 차단
          // Phase 0-B: shuffleArray 로 응답 시점 셔플 — position 암기 exploit 차단
          options: shuffleArray(q.options).map((opt) => ({
            text: opt.text,
          })),
        }))
  );

  return shuffleArray(questions);
}
