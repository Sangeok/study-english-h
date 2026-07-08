import prisma from "@/lib/db";
import { LEAGUE_TIERS } from "../config/league-tiers";
import type { TxClient } from "../types";

/**
 * 포인트 기반 티어 계산
 */
function calculateTier(points: number): number {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (points >= LEAGUE_TIERS[i].minPoints) {
      return LEAGUE_TIERS[i].tier;
    }
  }
  return 1;
}

/**
 * 리그 포인트 추가 + 자동 승급
 * tx 파라미터로 트랜잭션 클라이언트를 받아 원자성을 보장한다.
 */
export async function addLeaguePoints(
  userId: string,
  points: number,
  tx: TxClient = prisma
) {
  const league = await tx.userLeague.upsert({
    where: { userId },
    create: { userId, tier: 1, leaguePoints: points },
    update: { leaguePoints: { increment: points } },
  });

  const newTier = calculateTier(league.leaguePoints);
  if (newTier <= league.tier) {
    return { league, promoted: false, newTierName: null };
  }

  const updatedLeague = await tx.userLeague.update({
    where: { userId },
    data: { tier: newTier },
  });

  return {
    league: updatedLeague,
    promoted: true,
    newTierName: LEAGUE_TIERS[newTier - 1].name,
  };
}

/**
 * 리그 내 랭킹 조회 (읽기 전용 — 트랜잭션 불필요)
 */
export async function getLeagueRanking(tier: number, limit: number = 10) {
  const users = await prisma.userLeague.findMany({
    where: { tier },
    orderBy: { leaguePoints: "desc" },
    take: limit,
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  return users.map((league, index) => ({
    rank: index + 1,
    userId: league.userId,
    nickname: league.user.name ?? "Unknown",
    points: league.leaguePoints,
    tier: league.tier,
  }));
}
