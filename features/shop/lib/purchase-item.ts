import prisma from "@/lib/db";
import { SHOP_ITEMS } from "../config/shop-items";
import { applyItemEffect } from "./apply-item-effect";
import { getCurrentOwnedCount } from "./get-current-owned-count";
import type { PurchaseResult } from "../types";

/**
 * 아이템 구매 처리 — 단일 prisma.$transaction으로 원자성 보장
 *
 * 흐름:
 * 1. config에서 아이템 조회
 * 2. 트랜잭션 내에서 프로필 조회 (spendableXP + 현재 보유량)
 * 3. application-level XP 부족 / maxOwned 체크
 * 4. spendableXP 차감 (DB CHECK 제약조건이 동시성 안전망)
 * 5. 아이템 효과 적용
 * 6. 구매 이력 기록
 */
export async function purchaseItem(
  userId: string,
  itemCode: string
): Promise<PurchaseResult> {
  const item = SHOP_ITEMS.find((i) => i.code === itemCode);
  if (!item) {
    return { success: false, error: "ITEM_NOT_FOUND" };
  }

  return prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.findUnique({
      where: { userId },
      select: {
        spendableXP: true,
        freezeCount: true,
        freeHintCount: true,
        xpBoostCharges: true,
      },
    });

    if (!profile) {
      return { success: false, error: "PROFILE_NOT_FOUND" };
    }

    if (profile.spendableXP < item.xpCost) {
      return { success: false, error: "INSUFFICIENT_XP" };
    }

    if (item.maxOwned !== undefined) {
      const currentOwned = getCurrentOwnedCount(item, profile);
      // "구매 후 총 보유량"이 maxOwned를 초과하지 않도록 1회 증분을 반영해 검사한다.
      if (currentOwned + item.grantPerPurchase > item.maxOwned) {
        return { success: false, error: "MAX_OWNED" };
      }
    }

    // CHECK 제약조건(spendableXP >= 0)이 동시 요청의 안전망 역할을 한다
    await tx.userProfile.update({
      where: { userId },
      data: { spendableXP: { decrement: item.xpCost } },
    });

    await applyItemEffect(item, userId, tx);

    await tx.userPurchase.create({
      data: { userId, itemCode: item.code, xpCost: item.xpCost },
    });

    const updatedProfile = await tx.userProfile.findUnique({
      where: { userId },
      select: { spendableXP: true },
    });

    return {
      success: true,
      newSpendableXP: updatedProfile?.spendableXP ?? 0,
      message: `${item.nameKo}을(를) 구매했습니다!`,
    };
  });
}
