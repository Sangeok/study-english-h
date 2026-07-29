import prisma from "@/lib/db";
import { MASTERY_SCORE, LEVEL_PROGRESS, type CefrLevel } from "@/shared/constants";
import { calculateLevelProgress } from "../lib/level-progress";

interface MaturityRow {
  mastery: string;
  count: number;
}

/** 주입 가능한 now — streak.ts·get-vocabulary-stats.ts 관례.
 *  level 은 CefrLevel 로 강제한다: difficulty 는 Prisma enum(QuestionDifficulty)이라
 *  자유 string 을 넘기면 tsc 가 거부한다. 호출부(라우트)가 cefrLevelSchema.safeParse 로 정규화한다. */
export async function getLevelProgress(
  userId: string,
  level: CefrLevel,
  now: Date = new Date()
): Promise<number> {
  const [maturityRows, recentAttempts, reviewDebt] = await Promise.all([
    // 성숙도는 Vocabulary.level 조인 groupBy 가 필요해 raw SQL (period-stats 선례).
    // 테이블명은 @@map 기준: user_vocabularies, vocabularies.
    prisma.$queryRaw<MaturityRow[]>`
      SELECT uv."masteryLevel" AS mastery, COUNT(*)::int AS count
      FROM "user_vocabularies" uv
      JOIN "vocabularies" v ON v."id" = uv."vocabularyId"
      WHERE uv."userId" = ${userId} AND v."level" = ${level}
      GROUP BY uv."masteryLevel"
    `,
    prisma.userQuizAttempt.findMany({
      where: { userId, question: { difficulty: level } },
      orderBy: { attemptedAt: "desc" },
      take: LEVEL_PROGRESS.ACCURACY_WINDOW,
      select: { isCorrect: true },
    }),
    // 복습 부채 — "복습 도래" 술어(nextReviewDate ≤ now)는 get-vocabulary-stats.ts 의 reviewNeeded 와
    //   동일 정의를 공동 소유한다. 둘 중 하나에서 술어가 바뀌면 반드시 함께 바꿀 것 —
    //   진행률 페널티 D 와 화면의 "복습 N개"가 조용히 어긋나지 않도록(F3).
    prisma.userVocabulary.count({
      where: { userId, nextReviewDate: { lte: now } },
    }),
  ]);

  let maturityScoreSum = 0;
  for (const row of maturityRows) {
    maturityScoreSum += (MASTERY_SCORE[row.mastery] ?? 0) * row.count;
  }

  const recentCorrectCount = recentAttempts.filter((a) => a.isCorrect).length;

  return calculateLevelProgress({
    maturityScoreSum,
    recentAttemptCount: recentAttempts.length,
    recentCorrectCount,
    reviewDebt,
  });
}
