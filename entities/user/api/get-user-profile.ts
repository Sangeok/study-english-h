import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type UserProfileData = Prisma.UserProfileGetPayload<{
  select: { level: true; lastStudyDate: true; currentStreak: true };
}>;

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  return prisma.userProfile.findUnique({
    where: { userId },
    select: {
      level: true,
      lastStudyDate: true,
      currentStreak: true,
    },
  });
}
