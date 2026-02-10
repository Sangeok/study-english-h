import prisma from "@/lib/db";

/**
 * UTC Date를 KST(UTC+9) 기준 YYYY-MM-DD 문자열로 변환
 * 한국은 DST가 없으므로 고정 +9시간
 */
export function toKSTDateString(date: Date): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().split("T")[0];
}

interface StreakUpdateResult {
  lastStudyDate: Date;
  currentStreak: number;
  longestStreak: number;
}

/**
 * streak 업데이트 값을 계산하는 순수 함수
 * - lastStudyDate가 null → 첫 학습, streak 1
 * - KST 기준 같은 날 → 변경 없음 (중복 증가 방지)
 * - KST 기준 어제 → currentStreak + 1
 * - KST 기준 2일 이상 전 → currentStreak 리셋 to 1
 */
export function calculateStreakUpdate(
  lastStudyDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date()
): StreakUpdateResult {
  const todayKST = toKSTDateString(now);

  if (!lastStudyDate) {
    return {
      lastStudyDate: now,
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
    };
  }

  const lastKST = toKSTDateString(lastStudyDate);

  // 같은 날 → 변경 없음
  if (lastKST === todayKST) {
    return {
      lastStudyDate: now,
      currentStreak,
      longestStreak,
    };
  }

  // 어제인지 확인: KST 기준 오늘에서 하루 빼기
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayKSTDate = new Date(now.getTime() + kstOffset);
  todayKSTDate.setUTCHours(0, 0, 0, 0);
  const yesterdayKSTDate = new Date(todayKSTDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKST = yesterdayKSTDate.toISOString().split("T")[0];

  if (lastKST === yesterdayKST) {
    const newStreak = currentStreak + 1;
    return {
      lastStudyDate: now,
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
    };
  }

  // 2일 이상 전 → 리셋
  return {
    lastStudyDate: now,
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
  };
}

/**
 * DB에서 현재 프로필을 읽고 streak 업데이트 데이터를 반환
 */
export async function getStreakUpdateData(
  userId: string,
  now: Date = new Date()
): Promise<StreakUpdateResult> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { lastStudyDate: true, currentStreak: true, longestStreak: true },
  });

  return calculateStreakUpdate(
    profile?.lastStudyDate ?? null,
    profile?.currentStreak ?? 0,
    profile?.longestStreak ?? 0,
    now
  );
}
