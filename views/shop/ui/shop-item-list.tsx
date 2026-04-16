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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-md animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-9 bg-gray-200 rounded-2xl w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-md text-center">
        <p className="text-4xl mb-3">🏪</p>
        <p className="text-purple-950 font-semibold">아직 판매 중인 아이템이 없습니다</p>
        <p className="text-sm text-gray-500 mt-1">곧 새로운 아이템이 추가될 예정입니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <ShopItemCard
          key={item.code}
          item={item}
          onPurchase={onPurchase}
          isPurchasing={isPurchasing}
        />
      ))}
    </div>
  );
}
