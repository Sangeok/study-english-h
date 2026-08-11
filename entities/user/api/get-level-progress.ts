import prisma from "@/lib/db";
import { MASTERY_SCORE, LEVEL_PROGRESS, type CefrLevel } from "@/shared/constants";
import { calculateLevelProgress } from "../lib/level-progress";
import { getReviewDueFilter } from "../lib/review-due";

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
  const [maturityRows, recentAttempts, reviewDebt, totalWords] = await Promise.all([
    // 성숙도는 Vocabulary.level 조인 groupBy 가 필요해 raw SQL (period-stats 선례).
    // 테이블명은 @@map 기준: user_vocabularies, vocabularies.
    prisma.$queryRaw<MaturityRow[]>`
      SELECT uv."masteryLevel" AS mastery, COUNT(*)::int AS count
      FROM "user_vocabularies" uv
      JOIN "vocabularies" v ON v."id" = uv."vocabularyId"
      WHERE uv."userId" = ${userId} AND v."level" = ${level}
      GROUP BY uv."masteryLevel"
    `,
    // B 성분의 표본 — **읽기 문항만** 들어온다. question 조인이 필수 FK 라 리스닝은
    //   애초에 이 테이블에 없다(§P2-1 결정 3). "최근 정답률"이 아니라 "최근 읽기 정답률"이다.
    prisma.userQuizAttempt.findMany({
      where: { userId, question: { difficulty: level } },
      orderBy: { attemptedAt: "desc" },
      take: LEVEL_PROGRESS.ACCURACY_WINDOW,
      select: { isCorrect: true },
    }),
    // 복습 부채 — "복습 도래" 술어의 정본은 ../lib/review-due 의 getReviewDueFilter 다.
    //   get-vocabulary-stats.ts 의 reviewNeeded·리스닝 캐스케이드 1단계가 같은 헬퍼를 쓴다.
    //   여기서 시간 조건을 직접 쓰면 진행률 페널티 D 와 화면의 "복습 N개"가 조용히 어긋난다(F3).
    //   **시간 조건만 공유하고 레벨 스코프는 리스닝만 갖는다** — 여기와 get-vocabulary-stats 는
    //   사용자의 전 레벨 도래 단어를 세고, 캐스케이드는 현재 레벨로 좁힌다.
    //   "일관성"을 이유로 어느 한쪽의 레벨 필터를 지우거나 넣지 말 것.
    prisma.userVocabulary.count({
      where: { userId, nextReviewDate: getReviewDueFilter(now) },
    }),
    // 부채 비율의 분모 — reviewDebt 와 **같은 스코프(레벨 무관 전체)** 여야 비율이 성립한다.
    //   여기에 레벨 필터를 넣으면 분자는 전 레벨, 분모는 현재 레벨이 되어 비율이 1 을 넘는다.
    prisma.userVocabulary.count({ where: { userId } }),
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
    totalWords,
  });
}
