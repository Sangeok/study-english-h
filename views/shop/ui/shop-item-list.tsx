import { Store } from "lucide-react";
import { ShopItemCard } from "@/features/shop";
import type { ShopItemWithStatus } from "@/features/shop/types";

interface ShopItemListProps {
  items: ShopItemWithStatus[];
  onPurchase: (itemCode: string) => void;
  isPurchasing: boolean;
  isLoading: boolean;
}

export function ShopItemList({ items, onPurchase, isPurchasing, isLoading }: ShopItemListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="tactile-card p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="tactile-tile h-14 w-14 shrink-0 border-border-warm bg-muted-warm" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted-warm" />
                <div className="h-3 w-full rounded bg-muted-warm" />
              </div>
            </div>
            <div className="mt-5 flex justify-between border-t border-border-warm pt-4">
              <div className="h-8 w-24 rounded-full bg-muted-warm" />
              <div className="h-9 w-16 rounded-2xl bg-muted-warm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="tactile-card p-12 text-center">
        <div className="tactile-tile mx-auto mb-4 h-16 w-16 border-ocean bg-ocean-tint text-ocean-edge">
          <Store className="h-7 w-7" />
        </div>
        <p className="font-display text-lg font-bold text-ink">
          아직 판매 중인 아이템이 없습니다
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          곧 새로운 아이템이 추가될 예정입니다
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item.code}
          className="animate-slide-up opacity-0"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <ShopItemCard
            item={item}
            onPurchase={onPurchase}
            isPurchasing={isPurchasing}
          />
        </div>
      ))}
    </div>
  );
}
