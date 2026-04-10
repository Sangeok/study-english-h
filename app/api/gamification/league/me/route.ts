import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import prisma from "@/lib/db";

/**
 * GET /api/gamification/league/me
 * 현재 로그인 유저의 리그 정보 (tier, points) 반환
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const league = await prisma.userLeague.findUnique({
    where: { userId: session.user.id },
    select: { tier: true, leaguePoints: true },
  });

  return NextResponse.json({
    tier: league?.tier ?? 1,
    leaguePoints: league?.leaguePoints ?? 0,
  });
}
