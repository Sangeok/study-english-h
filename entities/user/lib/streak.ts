/**
 * UTC Date를 KST(Asia/Seoul) 기준 YYYY-MM-DD 문자열로 변환
 * en-CA 로케일은 ISO 8601 형식(YYYY-MM-DD)을 네이티브 출력하므로 파싱 불필요
 */
export function toKSTDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

export interface StreakUpdateResult {
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

  if (lastKST === todayKST) {
    return {
      lastStudyDate: now,
      currentStreak,
      longestStreak,
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
    };
  }

  return {
    lastStudyDate: now,
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
  };
}

/**
 * 조회 시점 기준으로 유효한 currentStreak를 계산
 * - 마지막 학습일이 오늘/어제(KST)이면 저장된 streak 유지
 * - 그 외는 연속이 끊긴 상태로 간주하여 0 반환
 */
export function calculateEffectiveCurrentStreak(
  lastStudyDate: Date | null,
  currentStreak: number,
  now: Date = new Date()
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

  return 0;
}
