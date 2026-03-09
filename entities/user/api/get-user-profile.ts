import prisma from "@/lib/db";

export interface UserProfileData {
  level: string;
  lastStudyDate: Date | null;
  currentStreak: number;
}

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
