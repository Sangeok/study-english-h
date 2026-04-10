import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastStudyDate: true,
      freezeCount: true,
    },
  });

  return NextResponse.json({
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    lastStudyDate: profile?.lastStudyDate?.toISOString() ?? null,
    freezeCount: profile?.freezeCount ?? 0,
  });
}
