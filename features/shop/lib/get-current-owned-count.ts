/**
 * 아이템별 현재 보유량을 UserProfile 필드에서 읽어온다.
 *
 * 호출처:
 *   - features/shop/lib/purchase-item.ts (구매 직전 maxOwned 체크)
 *   - app/api/shop/items/route.ts (상점 카드 표시용)
 *
 * 신규 아이템 추가 시 이 함수 한 곳만 수정한다.
 * quiz_boost_charge는 maxOwned 미설정이므로 분기에서 제외 — YAGNI.
 */

interface OwnedCountSource {
  freezeCount: number;
  freeHintCount: number;
}

export function getCurrentOwnedCount(
  itemCode: string,
  profile: OwnedCountSource
): number {
  if (itemCode === "streak_freeze") return profile.freezeCount;
  if (itemCode === "hint_pack_3") return profile.freeHintCount;
  return 0;
}
