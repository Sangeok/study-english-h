import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { SHOP_ITEMS } from "@/features/shop/config/shop-items";
import { getCurrentOwnedCount } from "@/features/shop/lib/get-current-owned-count";
import { getTodayKSTRange } from "@/entities/user/lib/streak";
import prisma from "@/lib/db";
import type { ShopItemWithStatus, BoostNextTarget } from "@/features/shop/types";

function resolveBoostNextTarget(
  charges: number,
  quizDone: boolean
): BoostNextTarget {
  if (charges <= 0) return null;
  if (quizDone) return "tomorrow_quiz";
  return "today_quiz";
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        spendableXP: true,
        freezeCount: true,
        freeHintCount: true,
        xpBoostCharges: true,
      },
    });

    const spendableXP = profile?.spendableXP ?? 0;
    const freezeCount = profile?.freezeCount ?? 0;
    const freeHintCount = profile?.freeHintCount ?? 0;
    const boostCharges = profile?.xpBoostCharges ?? 0;

    // v2: 오늘 퀴즈 완료 여부 — 미리보기 뱃지 + 구매 모달이 정확한 "오늘/내일" 표기에 사용
    const todayQuizCount = await prisma.userQuizAttempt.count({
      where: { userId, attemptedAt: getTodayKSTRange() },
    });
    const todayQuizDone = todayQuizCount > 0;

    const boostNextTarget = resolveBoostNextTarget(boostCharges, todayQuizDone);

    const items: ShopItemWithStatus[] = SHOP_ITEMS.map((item) => {
      const currentOwned = getCurrentOwnedCount(item, {
        freezeCount,
        freeHintCount,
        xpBoostCharges: boostCharges,
      });
      return {
        ...item,
        canPurchase:
          spendableXP >= item.xpCost &&
          (item.maxOwned === undefined || currentOwned < item.maxOwned),
        currentOwned,
      };
    });

    return NextResponse.json({
      items,
      spendableXP,
      boostCharges,
      boostNextTarget,
      todayQuizDone,
    });
  } catch (error) {
    console.error("Shop items error:", error);
    return NextResponse.json(
      { error: "상점 정보를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
