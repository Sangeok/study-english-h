import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { calculateStreakUpdate, type StreakUpdateResult } from "../lib/streak";

type StreakProfileReader = Pick<Prisma.TransactionClient, "userProfile">;

/**
 * DB에서 현재 프로필을 읽고 streak 업데이트 데이터를 반환
 */
export async function getStreakUpdateData(
  userId: string,
  now: Date = new Date(),
  database: StreakProfileReader = prisma
): Promise<StreakUpdateResult> {
  const profile = await database.userProfile.findUnique({
    where: { userId },
    select: {
      lastStudyDate: true,
      currentStreak: true,
      longestStreak: true,
      freezeCount: true,
    },
  });

  return calculateStreakUpdate(
    profile?.lastStudyDate ?? null,
    profile?.currentStreak ?? 0,
    profile?.longestStreak ?? 0,
    now,
    profile?.freezeCount ?? 0
  );
}
