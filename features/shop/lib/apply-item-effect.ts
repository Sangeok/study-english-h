import type { TxClient } from "@/entities/gamification";
import { HINT_PACK_FREE_HINT_COUNT } from "../config/shop-items";

type EffectHandler = (userId: string, tx: TxClient) => Promise<void>;

/**
 * 아이템 효과 핸들러 맵.
 * 새 아이템 추가 시 여기에 핸들러만 등록하면 된다.
 * 반드시 트랜잭션 내부에서 호출할 것.
 */
const EFFECT_HANDLERS: Record<string, EffectHandler> = {
  streak_freeze: async (userId, tx) => {
    await tx.userProfile.update({
      where: { userId },
      data: { freezeCount: { increment: 1 } },
    });
  },

  quiz_boost_charge: async (userId, tx) => {
    await tx.userProfile.update({
      where: { userId },
      data: { xpBoostCharges: { increment: 1 } },
    });
  },

  hint_pack_3: async (userId, tx) => {
    await tx.userProfile.update({
      where: { userId },
      data: { freeHintCount: { increment: HINT_PACK_FREE_HINT_COUNT } },
    });
  },
};

export async function applyItemEffect(
  itemCode: string,
  userId: string,
  tx: TxClient
): Promise<void> {
  // Object.hasOwn으로 prototype 체인 접근 차단
  //   itemCode가 "constructor" / "toString" / "__proto__" 등일 때
  //   Record 인덱싱은 Object.prototype 함수를 반환한다.
  if (!Object.hasOwn(EFFECT_HANDLERS, itemCode)) {
    throw new Error(`Unknown item: ${itemCode}`);
  }
  const handler = EFFECT_HANDLERS[itemCode];
  await handler(userId, tx);
}
