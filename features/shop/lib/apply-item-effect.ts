import type { TxClient } from "@/entities/gamification";
import type { ShopItem } from "../config/shop-items";

/**
 * 아이템 효과 적용 — 정의(shop-items.ts)의 effectField를 grantPerPurchase만큼 증가시킨다.
 * 신규 아이템은 shop-items.ts 정의만 추가하면 된다.
 * 반드시 트랜잭션 내부에서 호출할 것.
 */
export async function applyItemEffect(
  item: ShopItem,
  userId: string,
  tx: TxClient
): Promise<void> {
  await tx.userProfile.update({
    where: { userId },
    data: { [item.effectField]: { increment: item.grantPerPurchase } },
  });
}
