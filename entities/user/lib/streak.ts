/**
 * UTC Date를 KST(Asia/Seoul) 기준 YYYY-MM-DD 문자열로 변환
 * en-CA 로케일은 ISO 8601 형식(YYYY-MM-DD)을 네이티브 출력하므로 파싱 불필요
 */
export function toKSTDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

/**
 * KST 기준 오늘 00:00:00 ~ 내일 00:00:00 범위를 UTC Date로 반환
 * Prisma의 `where: { attemptedAt: getTodayKSTRange() }` 형태로 사용
 */
export function getTodayKSTRange(now: Date = new Date()): { gte: Date; lt: Date } {
  const todayKST = toKSTDateString(now);
  const gte = new Date(`${todayKST}T00:00:00+09:00`);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

export interface StreakUpdateResult {
  lastStudyDate: Date;
  currentStreak: number;
  longestStreak: number;
  freezeUsed: boolean;
  newFreezeCount: number;
}

/**
 * streak 업데이트 값을 계산하는 순수 함수
 * - lastStudyDate가 null → 첫 학습, streak 1
 * - KST 기준 같은 날 → 변경 없음 (중복 증가 방지)
 * - KST 기준 어제 → currentStreak + 1
 * - KST 기준 2일 이상 전 + freezeCount > 0 → streak 유지, freeze 차감
 * - KST 기준 2일 이상 전 + freezeCount = 0 → currentStreak 리셋 to 1
 */
export function calculateStreakUpdate(
  lastStudyDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date(),
  freezeCount: number = 0
): StreakUpdateResult {
  const todayKST = toKSTDateString(now);

  if (!lastStudyDate) {
    return {
      lastStudyDate: now,
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      freezeUsed: false,
      newFreezeCount: freezeCount,
    };
  }

  const lastKST = toKSTDateString(lastStudyDate);

  if (lastKST === todayKST) {
    return {
      lastStudyDate: now,
      currentStreak,
      longestStreak,
      freezeUsed: false,
      newFreezeCount: freezeCount,
    };
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKST = toKSTDateString(yesterday);

  if (lastKST === yesterdayKST) {
    const newStreak = currentStreak + 1;
    return {
      lastStudyDate: now,
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      freezeUsed: false,
      newFreezeCount: freezeCount,
    };
  }

  // 2일 이상 경과: freeze가 있으면 streak 유지하고 freeze 차감
  if (freezeCount > 0) {
    return {
      lastStudyDate: now,
      currentStreak,
      longestStreak,
      freezeUsed: true,
      newFreezeCount: freezeCount - 1,
    };
  }

  return {
    lastStudyDate: now,
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    freezeUsed: false,
    newFreezeCount: 0,
  };
}

/**
 * 조회 시점 기준으로 유효한 currentStreak를 계산
 * - 마지막 학습일이 오늘/어제(KST)이면 저장된 streak 유지
 * - freezeCount > 0이면 2일 이상 경과해도 streak 유효로 간주
 * - 그 외는 연속이 끊긴 상태로 간주하여 0 반환
 */
export function calculateEffectiveCurrentStreak(
  lastStudyDate: Date | null,
  currentStreak: number,
  now: Date = new Date(),
  freezeCount: number = 0
): number {
  if (!lastStudyDate || currentStreak <= 0) {
    return 0;
  }

  const todayKST = toKSTDateString(now);
  const lastKST = toKSTDateString(lastStudyDate);

  if (lastKST === todayKST) {
    return currentStreak;
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKST = toKSTDateString(yesterday);

  if (lastKST === yesterdayKST) {
    return currentStreak;
  }

  // freeze가 있으면 streak 유효로 간주
  if (freezeCount > 0) {
    return currentStreak;
  }

  return 0;
}
