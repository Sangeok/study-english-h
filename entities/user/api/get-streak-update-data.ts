import prisma from "@/lib/db";
import { calculateStreakUpdate, type StreakUpdateResult } from "../lib/streak";

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
