"use client";

import { cn } from "@/lib/utils";
import { GradientButton } from "@/shared/ui";
import type { ShopItemWithStatus } from "@/features/shop/types";

interface ShopItemCardProps {
  item: ShopItemWithStatus;
  onPurchase: (itemCode: string) => void;
  isPurchasing: boolean;
}

export function ShopItemCard({ item, onPurchase, isPurchasing }: ShopItemCardProps) {
  const isMaxOwned = item.maxOwned !== undefined && item.currentOwned >= item.maxOwned;
  const isDisabled = !item.canPurchase || isPurchasing || isMaxOwned;

  function getButtonLabel() {
    if (isMaxOwned) return "보유 최대";
    if (!item.canPurchase) return "XP 부족";
    return "구매";
  }

  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-6 shadow-md border transition-all duration-200",
        item.canPurchase && !isMaxOwned
          ? "border-purple-100 hover:shadow-lg"
          : "border-gray-100 opacity-70"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-2xl">{item.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-purple-950">{item.nameKo}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>

          {item.maxOwned !== undefined && (
            <p className="text-xs text-purple-600 mt-1.5 font-medium">
              보유 {item.currentOwned} / {item.maxOwned}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-purple-700 font-semibold text-sm">
          ✨ {item.xpCost.toLocaleString()} XP
        </span>
        <GradientButton
          variant={isDisabled ? "outline" : "primary"}
          onClick={() => onPurchase(item.code)}
          disabled={isDisabled}
          className="px-5 py-2.5 text-sm font-semibold"
        >
          {getButtonLabel()}
        </GradientButton>
      </div>
    </div>
  );
}
