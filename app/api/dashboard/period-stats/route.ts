import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import prisma from "@/lib/db";
import { toKSTDateString } from "@/entities/user/lib/streak";
import { dashboardPeriodSchema } from "@/features/dashboard/lib/validation";
import type { PeriodStatsResponse, DailyStudyStat } from "@/features/dashboard/types";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = dashboardPeriodSchema.safeParse({
      period: searchParams.get("period") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "유효하지 않은 기간 파라미터", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const userId = session.user.id;
    const startDate = getStartDate(period);

    const [
      quizAggregate,
      correctCount,
      flashcardAggregate,
      dailyQuizRows,
      dailyFlashcardRows,
      categoryRows,
    ] = await Promise.all([
      // 1) 퀴즈 총합 (count + sum) — DB aggregate
      prisma.userQuizAttempt.aggregate({
        where: { userId, attemptedAt: { gte: startDate } },
        _count: { _all: true },
        _sum: { timeSpent: true },
      }),
      // 2) 정답 수 — DB count
      prisma.userQuizAttempt.count({
        where: { userId, attemptedAt: { gte: startDate }, isCorrect: true },
      }),
      // 3) 플래시카드 총합 (count + sum) — DB aggregate
      prisma.flashcardSession.aggregate({
        where: { userId, createdAt: { gte: startDate } },
        _count: { _all: true },
        _sum: { duration: true },
      }),
      // 4) 퀴즈 일별 집계 (KST) — raw SQL
      //    AT TIME ZONE 이중 변환 필수:
      //    schema DateTime 컬럼은 @db.Timestamptz 없음 → timestamp(3) without time zone
      //    Prisma 드라이버가 JS Date를 UTC wall-clock naive timestamp로 저장.
      //    AT TIME ZONE 'UTC': naive → timestamptz(UTC로 해석)
      //    AT TIME ZONE 'Asia/Seoul': timestamptz → naive KST 벽시계
      prisma.$queryRaw<DailyAggregateRow[]>`
        SELECT
          TO_CHAR("attemptedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS count,
          COALESCE(SUM("timeSpent"), 0)::int AS total_time
        FROM "UserQuizAttempt"
        WHERE "userId" = ${userId} AND "attemptedAt" >= ${startDate}
        GROUP BY date
      `,
      // 5) 플래시카드 일별 집계 (KST) — raw SQL (동일한 이중 변환)
      prisma.$queryRaw<DailyAggregateRow[]>`
        SELECT
          TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS count,
          COALESCE(SUM("duration"), 0)::int AS total_time
        FROM "flashcard_sessions"
        WHERE "userId" = ${userId} AND "createdAt" >= ${startDate}
        GROUP BY date
      `,
      // 6) 신규 학습 어휘의 카테고리 분포 — raw SQL (join)
      //    UserVocabulary.createdAt 기준: 기간 내 처음 학습 목록에 추가된 어휘 카테고리
      prisma.$queryRaw<CategoryRow[]>`
        SELECT v."category", COUNT(*)::int AS count
        FROM "user_vocabularies" uv
        INNER JOIN "vocabularies" v ON uv."vocabularyId" = v."id"
        WHERE uv."userId" = ${userId} AND uv."createdAt" >= ${startDate}
        GROUP BY v."category"
      `,
    ]);

    const totalQuizzes = quizAggregate._count._all;
    const quizStudyTimeSec = quizAggregate._sum.timeSpent ?? 0;
    const quizAccuracy = totalQuizzes > 0
      ? Math.round((correctCount / totalQuizzes) * 100)
      : 0;

    const totalFlashcardSessions = flashcardAggregate._count._all;
    const flashcardStudyTimeSec = flashcardAggregate._sum.duration ?? 0;

    const dailyStats = mergeDailyStats(dailyQuizRows, dailyFlashcardRows, period);

    const categoryStats = categoryRows.map((r) => ({
      category: r.category,
      count: r.count,
    }));

    const response: PeriodStatsResponse = {
      totalQuizzes,
      quizAccuracy,
      quizStudyTimeSec,
      totalFlashcardSessions,
      flashcardStudyTimeSec,
      totalStudyTimeSec: quizStudyTimeSec + flashcardStudyTimeSec,
      dailyStats,
      categoryStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard period stats error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────
// Raw SQL 응답 타입
// ────────────────────────────────────────────────────────────

interface DailyAggregateRow {
  date: string;
  count: number;
  total_time: number;
}

interface CategoryRow {
  category: string;
  count: number;
}

// ────────────────────────────────────────────────────────────
// 헬퍼 함수
// ────────────────────────────────────────────────────────────

const PERIOD_DAYS: Record<string, number> = {
  day: 1,
  week: 7,
  month: 30,
  all: 90,
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 기간별 조회 시작일 계산 (KST 자정 기준).
 * DB 쿼리와 차트 날짜 축의 KST 경계를 일치시켜 자정 근처 데이터 누락/중복 방지.
 */
function getStartDate(period: string): Date {
  const days = PERIOD_DAYS[period] ?? 7;
  const now = new Date();
  const nowKstShifted = new Date(now.getTime() + KST_OFFSET_MS);
  nowKstShifted.setUTCHours(0, 0, 0, 0);
  const startKstShifted = new Date(
    nowKstShifted.getTime() - (days - 1) * MS_PER_DAY
  );
  return new Date(startKstShifted.getTime() - KST_OFFSET_MS);
}

function getDaysForPeriod(period: string): number {
  return PERIOD_DAYS[period] ?? 7;
}

/**
 * KST 기준 날짜 축 생성 후 DB 일별 집계 결과를 머지.
 * 학습 활동이 없는 날도 0으로 채워 차트가 끊기지 않도록 함.
 */
function mergeDailyStats(
  quizRows: DailyAggregateRow[],
  flashcardRows: DailyAggregateRow[],
  period: string
): DailyStudyStat[] {
  const days = getDaysForPeriod(period);

  const quizByDate = new Map<string, DailyAggregateRow>();
  for (const row of quizRows) quizByDate.set(row.date, row);

  const flashcardByDate = new Map<string, DailyAggregateRow>();
  for (const row of flashcardRows) flashcardByDate.set(row.date, row);

  const now = new Date();
  const nowKstShifted = new Date(now.getTime() + KST_OFFSET_MS);
  nowKstShifted.setUTCHours(0, 0, 0, 0);

  const stats: DailyStudyStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayKstShifted = new Date(nowKstShifted.getTime() - i * MS_PER_DAY);
    const dayUtc = new Date(dayKstShifted.getTime() - KST_OFFSET_MS);
    const dateStr = toKSTDateString(dayUtc);

    const quiz = quizByDate.get(dateStr);
    const flashcard = flashcardByDate.get(dateStr);

    stats.push({
      date: dateStr,
      quizCount: quiz?.count ?? 0,
      flashcardSessions: flashcard?.count ?? 0,
      totalStudyTimeSec: (quiz?.total_time ?? 0) + (flashcard?.total_time ?? 0),
    });
  }

  return stats;
}
