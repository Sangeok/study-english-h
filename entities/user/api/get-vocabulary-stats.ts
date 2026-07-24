import prisma from "@/lib/db";
import type { ProfileStats } from "../types";

// 응답 계약(ProfileStats)의 어휘 3필드에서 파생한다 — 구조를 손으로 복제하면 계약이 바뀔 때
// 생산자가 아니라 소비자(라우트)에서 깨진다.
export type VocabularyStats = Pick<
  ProfileStats,
  "totalWordLearned" | "masteredWords" | "reviewNeeded"
>;

/**
 * 어휘 통계를 DB 현재 상태에서 집계한다 (쓰기 없음).
 *
 * reviewNeeded 는 시간 의존 값(nextReviewDate 경과로 증가)이라 쓰기 시점 컬럼 캐시로는
 * 정확할 수 없다 — 읽기 시점에 이 함수를 호출해야 한다. 이 근거의 정본은 여기 하나다.
 * 두 쿼리 모두 인덱스 집계이며(@@index([userId, masteryLevel]), @@index([userId, nextReviewDate]))
 * 서로 독립이라 병렬 실행한다.
 *
 * totalWordLearned 는 SRS 에 편입된 단어 수다(masteryLevel 무관 — 퀴즈 오답 편입 포함).
 * "학습 완료"가 아니므로 표시 문구를 바꿀 때 주의한다.
 *
 * 이 함수는 UI 읽기 경로(stats 라우트)와 업적 쓰기 경로(updateProfileStats → 컬럼)가 공유하는
 * 계약이다. 표시용 조정(예: "new" 제외)을 이 함수 안에서 하면 업적 자격이 함께 바뀐다 —
 * 그런 조정은 stats 라우트에서 결과를 후처리해 한다.
 *
 * now 를 주입 가능하게 둔 것은 시간 의존 헬퍼의 기존 관례를 따른 것이다
 * (../lib/streak 의 getTodayKSTRange·calculateStreakUpdate·calculateEffectiveCurrentStreak).
 */
export async function getVocabularyStats(
  userId: string,
  now: Date = new Date()
): Promise<VocabularyStats> {
  const [masteryCounts, reviewNeeded] = await Promise.all([
    prisma.userVocabulary.groupBy({
      by: ["masteryLevel"],
      where: { userId },
      _count: true,
    }),
    prisma.userVocabulary.count({
      where: {
        userId,
        nextReviewDate: {
          lte: now,
        },
      },
    }),
  ]);

  let totalWordLearned = 0;
  let masteredWords = 0;

  for (const bucket of masteryCounts) {
    totalWordLearned += bucket._count;

    if (bucket.masteryLevel === "mastered") {
      masteredWords += bucket._count;
    }
  }

  return { totalWordLearned, masteredWords, reviewNeeded };
}
