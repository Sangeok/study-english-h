"use client";

import { cn } from "@/lib/utils";
import type { ShopItemWithStatus } from "@/features/shop/types";

interface ShopItemCardProps {
  item: ShopItemWithStatus;
  onPurchase: (itemCode: string) => void;
  isPurchasing: boolean;
}

export function ShopItemCard({ item, onPurchase, isPurchasing }: ShopItemCardProps) {
  const isMaxOwned = item.maxOwned !== undefined && item.currentOwned >= item.maxOwned;
  const isDisabled = !item.canPurchase || isPurchasing || isMaxOwned;
  const isAffordable = item.canPurchase && !isMaxOwned;

  function getButtonLabel() {
    if (isMaxOwned) return "보유 최대";
    if (!item.canPurchase) return "XP 부족";
    return "구매";
  }

  // Disabled buy button keeps tactile shape but reads as muted; active = gold currency action.
  const buyClass = cn(
    "tactile-btn tactile-btn--sm",
    isAffordable ? "tactile-btn--gold" : "tactile-btn--ghost"
  );

  return (
    <div
      className={cn(
        "tactile-card p-6 flex flex-col",
        isAffordable && "tactile-card--interactive",
        isMaxOwned && "bg-teal-tint",
        !isAffordable && !isMaxOwned && "opacity-80"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-ink">{item.nameKo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {item.description}
          </p>

          {item.maxOwned !== undefined && (
            <div
              className={cn(
                "tactile-chip mt-2",
                isMaxOwned
                  ? "border-teal bg-teal-tint text-ink"
                  : "border-border-warm bg-muted-warm text-ink-soft"
              )}
            >
              보유 {item.currentOwned} / {item.maxOwned}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-warm pt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-gold-edge font-display font-bold tabular-nums text-lg">
            {item.xpCost.toLocaleString()}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
            XP
          </span>
        </div>
        <button
          type="button"
          onClick={() => onPurchase(item.code)}
          disabled={isDisabled}
          className={buyClass}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  );
}
