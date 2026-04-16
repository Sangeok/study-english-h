"use client";

import { GradientButton } from "@/shared/ui";
import type { ShopItemWithStatus } from "@/features/shop/types";

interface PurchaseConfirmModalProps {
  item: ShopItemWithStatus | null;
  spendableXP: number;
  /** v2: 충전권 구매 시 "오늘/내일" 정확 표기 (Issue 1.1) */
  todayQuizDone: boolean;
  isPurchasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PurchaseConfirmModal({
  item,
  spendableXP,
  todayQuizDone,
  isPurchasing,
  onConfirm,
  onCancel,
}: PurchaseConfirmModalProps) {
  if (!item) return null;

  const remainingAfter = spendableXP - item.xpCost;
  const isBoostCharge = item.code === "quiz_boost_charge";

  // (Issue 1.1): todayQuizDone 한 플래그로 결정
  //   오늘 미완료 → "오늘 일일 퀴즈"에 적용
  //   오늘 완료   → "내일 일일 퀴즈"에 적용
  const purchaseTargetLabel = todayQuizDone ? "내일 일일 퀴즈" : "오늘 일일 퀴즈";

  // (RV6) 진행 중 mutation은 abort되지 않으므로 백드롭/취소로 인한 "숨김 성공" 혼선 방지.
  //   isPurchasing=true일 때 onCancel은 no-op.
  const handleBackdropCancel = () => {
    if (isPurchasing) return;
    onCancel();
  };

  // code-style 규칙: JSX 내 삼항 금지 — 확인 버튼 라벨을 return 이전에 pre-compute.
  const confirmLabel = isPurchasing ? "구매 중…" : "구매";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">{item.icon}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-purple-950">구매 확인</h2>
            <p className="text-sm text-gray-500">{item.nameKo}</p>
          </div>
        </div>

        {isBoostCharge && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
            <p className="text-xs text-amber-800">
              📅 {purchaseTargetLabel}에 자동 적용됩니다
            </p>
          </div>
        )}

        <div className="space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">가격</span>
            <span className="font-semibold text-purple-700">
              ✨ {item.xpCost.toLocaleString()} XP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">보유 XP</span>
            <span>{spendableXP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-600">구매 후 잔액</span>
            <span className="font-semibold">
              {remainingAfter.toLocaleString()} XP
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <GradientButton
            variant="outline"
            onClick={handleBackdropCancel}
            disabled={isPurchasing}
            className="flex-1"
          >
            취소
          </GradientButton>
          <GradientButton
            variant="primary"
            onClick={onConfirm}
            disabled={isPurchasing}
            className="flex-1"
          >
            {confirmLabel}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
