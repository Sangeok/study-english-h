/** 아이템 효과가 반영되는 UserProfile 카운터 필드 */
export type ItemEffectField = "freezeCount" | "freeHintCount" | "xpBoostCharges";

export interface ShopItem {
  code: string;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  xpCost: number;
  category: "utility" | "cosmetic";
  /** 구매 후 총 보유 상한. maxOwned 검사식은 `currentOwned + grantPerPurchase > maxOwned` */
  maxOwned?: number;
  /** 구매 시 grantPerPurchase만큼 increment되는 효과 대상 필드 */
  effectField: ItemEffectField;
  grantPerPurchase: number;
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    code: "streak_freeze",
    name: "Streak Freeze",
    nameKo: "스트릭 보호권",
    description: "하루 공부를 빠뜨려도 스트릭이 유지됩니다",
    icon: "🧊",
    xpCost: 200,
    category: "utility",
    maxOwned: 5,
    effectField: "freezeCount",
    grantPerPurchase: 1,
  },
  {
    code: "quiz_boost_charge",
    name: "Quiz XP 2x Charge",
    nameKo: "퀴즈 XP 2배 충전권",
    description: "다음 일일 퀴즈의 XP가 2배로 지급됩니다 (보유 시 자동 적용)",
    icon: "⚡",
    xpCost: 150,
    category: "utility",
    // maxOwned 없음: 누적 보유 허용
    effectField: "xpBoostCharges",
    grantPerPurchase: 1,
  },
  {
    code: "hint_pack_3",
    name: "Free Hint Pack (3)",
    nameKo: "프리 힌트 3개 팩",
    description: "힌트를 사용해도 XP 페널티가 면제되는 프리 힌트 3개",
    icon: "💡",
    xpCost: 30,
    category: "utility",
    maxOwned: 9,
    effectField: "freeHintCount",
    grantPerPurchase: 3,
  },
];

export const QUIZ_BOOST_MULTIPLIER = 2.0;
