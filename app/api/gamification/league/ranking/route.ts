import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { getLeagueRanking } from "@/features/gamification/lib/league-points";
import { leagueRankingQuerySchema } from "@/features/gamification/lib/validation";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const validation = leagueRankingQuerySchema.safeParse({
    tier: searchParams.get("tier") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { tier, limit } = validation.data;
  const ranking = await getLeagueRanking(tier, limit);

  return NextResponse.json({ tier, ranking });
}
