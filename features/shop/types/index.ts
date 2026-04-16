import type { ShopItem } from "../config/shop-items";

export type PurchaseErrorCode =
  | "INSUFFICIENT_XP"
  | "MAX_OWNED"
  | "ITEM_NOT_FOUND"
  | "PROFILE_NOT_FOUND";

export interface PurchaseResult {
  success: boolean;
  newSpendableXP?: number;
  message?: string;
  error?: PurchaseErrorCode;
}

export interface ShopItemWithStatus extends ShopItem {
  canPurchase: boolean;
  currentOwned: number;
}

export type BoostNextTarget = "today_quiz" | "tomorrow_quiz" | null;

export interface ShopPageData {
  items: ShopItemWithStatus[];
  spendableXP: number;
  boostCharges: number;
  boostNextTarget: BoostNextTarget;
  /** v2: 모달이 첫 구매 시에도 "오늘/내일"을 정확히 표기하기 위해 노출 */
  todayQuizDone: boolean;
}

export interface PurchaseResponse {
  success: true;
  newSpendableXP: number;
  message: string;
}
