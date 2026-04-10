import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { ACHIEVEMENTS } from "@/features/gamification/config/achievements";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievement.code, ua.unlockedAt])
  );

  const all = ACHIEVEMENTS.map((a) => ({
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    unlocked: unlockedMap.has(a.code),
    unlockedAt: unlockedMap.get(a.code)?.toISOString() ?? null,
  }));

  return NextResponse.json({
    all,
    totalUnlocked: unlockedMap.size,
    totalAchievements: ACHIEVEMENTS.length,
  });
}
