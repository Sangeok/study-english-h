"use server";

import { getUserProfile } from "@/entities/user";
import { getSession } from "@/shared/lib/get-session";
import { calculateEffectiveCurrentStreak } from "@/shared/lib/update-streak";

export interface AppHeaderData {
  isAuthenticated: boolean;
  userName: string | null;
  level: string;
  streak: number;
}

const DEFAULT_LEVEL = "A1";
const DEFAULT_STREAK = 0;

export async function getAppHeaderData(): Promise<AppHeaderData> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      isAuthenticated: false,
      userName: null,
      level: DEFAULT_LEVEL,
      streak: DEFAULT_STREAK,
    };
  }

  try {
    const profile = await getUserProfile(userId);

    const effectiveStreak = calculateEffectiveCurrentStreak(
      profile?.lastStudyDate ?? null,
      profile?.currentStreak ?? DEFAULT_STREAK
    );

    return {
      isAuthenticated: true,
      userName: session.user.name ?? null,
      level: profile?.level ?? DEFAULT_LEVEL,
      streak: effectiveStreak,
    };
  } catch (error) {
    console.error("Failed to fetch app header profile data:", error);
    return {
      isAuthenticated: true,
      userName: session.user.name ?? null,
      level: DEFAULT_LEVEL,
      streak: DEFAULT_STREAK,
    };
  }
}
