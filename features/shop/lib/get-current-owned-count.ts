import type { ItemEffectField, ShopItem } from "../config/shop-items";

/**
 * 아이템별 현재 보유량을 UserProfile 카운터 필드(effectField)에서 읽어온다.
 *
 * 호출처:
 *   - features/shop/lib/purchase-item.ts (구매 직전 maxOwned 체크)
 *   - app/api/shop/items/route.ts (상점 카드 표시용)
 *
 * maxOwned가 없는 아이템(quiz_boost_charge)은 보유 상한 검사/표시 대상이 아니므로
 * 0을 반환한다 — 부스트 보유량은 상점 응답의 별도 boostCharges 필드로 내려간다.
 */

type OwnedCountSource = Record<ItemEffectField, number>;

export function getCurrentOwnedCount(
  item: ShopItem,
  profile: OwnedCountSource
): number {
  if (item.maxOwned === undefined) return 0;
  return profile[item.effectField];
}
