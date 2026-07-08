"use client";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in"
      onClick={handleBackdropCancel}
    >
      <div
        className="tactile-card tactile-card--raised w-full max-w-sm p-6 animate-[pop-in]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="font-display text-lg font-bold text-ink">구매 확인</h2>
          <p className="text-sm text-ink-soft">{item.nameKo}</p>
        </div>

        {isBoostCharge && (
          <div className="mb-5 rounded-2xl border border-gold bg-gold-tint p-3">
            <p className="text-xs font-semibold text-ink">
              {purchaseTargetLabel}에 자동 적용됩니다
            </p>
          </div>
        )}

        <div className="mb-6 space-y-3 rounded-2xl border border-border-warm bg-muted-warm p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">가격</span>
            <span className="text-gold-edge font-display font-bold tabular-nums">
              {item.xpCost.toLocaleString()} XP
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">보유 XP</span>
            <span className="font-display font-bold tabular-nums text-ink">
              {spendableXP.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border-warm pt-3">
            <span className="text-ink-soft">구매 후 잔액</span>
            <span className="font-display font-bold tabular-nums text-teal-edge">
              {remainingAfter.toLocaleString()} XP
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBackdropCancel}
            disabled={isPurchasing}
            className="tactile-btn tactile-btn--ghost tactile-btn--block flex-1"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPurchasing}
            className="tactile-btn tactile-btn--teal tactile-btn--block flex-1"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
