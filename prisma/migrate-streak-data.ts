/**
 * 기존 데이터 마이그레이션: streak 필드 계산
 *
 * 모든 UserProfile을 조회하고, 각 유저의 학습 활동 날짜를 기반으로
 * currentStreak과 longestStreak을 계산하여 DB에 저장합니다.
 *
 * 실행: npx tsx prisma/migrate-streak-data.ts
 */

import prisma from "../lib/db";

function toKSTDateString(date: Date): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().split("T")[0];
}

async function migrateStreakData() {
  console.log("Starting streak data migration...");

  const profiles = await prisma.userProfile.findMany({
    select: { userId: true },
  });

  console.log(`Found ${profiles.length} user profiles to process.`);

  let updated = 0;

  for (const profile of profiles) {
    const userId = profile.userId;

    // 모든 학습 활동 날짜 수집
    const [quizAttempts, flashcardSessions, diagnoses] = await Promise.all([
      prisma.userQuizAttempt.findMany({
        where: { userId },
        select: { attemptedAt: true },
        orderBy: { attemptedAt: "asc" },
      }),
      prisma.flashcardSession.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.levelDiagnosis.findMany({
        where: { userId },
        select: { completedAt: true },
        orderBy: { completedAt: "asc" },
      }),
    ]);

    // 모든 날짜를 KST 기준으로 정규화하고 중복 제거
    const allDates: Date[] = [
      ...quizAttempts.map((a) => a.attemptedAt),
      ...flashcardSessions.map((s) => s.createdAt),
      ...diagnoses.map((d) => d.completedAt),
    ];

    const uniqueKSTDates = [...new Set(allDates.map((d) => toKSTDateString(d)))].sort();

    if (uniqueKSTDates.length === 0) {
      continue;
    }

    // longestStreak 계산 (역사적 최대 연속일)
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueKSTDates.length; i++) {
      const prev = new Date(uniqueKSTDates[i - 1] + "T00:00:00Z");
      const curr = new Date(uniqueKSTDates[i] + "T00:00:00Z");
      const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // currentStreak 계산 (오늘부터 역순 연속일)
    const todayKST = toKSTDateString(new Date());
    const dateSet = new Set(uniqueKSTDates);

    let currentStreak = 0;
    let checkDate = new Date(todayKST + "T00:00:00Z");

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    // lastStudyDate는 가장 최근 활동일
    const lastDate = allDates.sort((a, b) => b.getTime() - a.getTime())[0];

    await prisma.userProfile.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak,
        lastStudyDate: lastDate,
      },
    });

    updated++;
    console.log(
      `  [${updated}/${profiles.length}] userId=${userId}: currentStreak=${currentStreak}, longestStreak=${longestStreak}`
    );
  }

  console.log(`\nMigration complete. Updated ${updated} profiles.`);
}

migrateStreakData()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
