"use client";

import { useState } from "react";
import { useToast } from "@/shared/ui";
import { PurchaseConfirmModal } from "@/features/shop";
import type { ShopItemWithStatus } from "@/features/shop/types";
import { ShopHeader } from "./shop-header";
import { ShopItemList } from "./shop-item-list";
import { useShopData, usePurchaseItem } from "../hooks/use-shop-data";

export function ShopPage() {
  const { data, isLoading } = useShopData();
  const { mutate: purchase, isPending } = usePurchaseItem();
  const { toast } = useToast();
  const [pendingItem, setPendingItem] = useState<ShopItemWithStatus | null>(null);

  function handleRequestPurchase(itemCode: string) {
    const item = data?.items.find((i) => i.code === itemCode);
    if (!item) return;
    setPendingItem(item);
  }

  function handleConfirm() {
    if (!pendingItem) return;
    purchase(pendingItem.code, {
      onSuccess: (result) => {
        toast(result.message, { variant: "success" });
        setPendingItem(null);
      },
      onError: (error) => {
        toast(error.message ?? "구매에 실패했습니다", { variant: "error" });
        setPendingItem(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <ShopHeader
        spendableXP={data?.spendableXP ?? 0}
        boostCharges={data?.boostCharges ?? 0}
        boostNextTarget={data?.boostNextTarget ?? null}
        isLoading={isLoading}
      />
      <ShopItemList
        items={data?.items ?? []}
        onPurchase={handleRequestPurchase}
        isPurchasing={isPending}
        isLoading={isLoading}
      />
      <PurchaseConfirmModal
        item={pendingItem}
        spendableXP={data?.spendableXP ?? 0}
        todayQuizDone={data?.todayQuizDone ?? false}
        isPurchasing={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setPendingItem(null)}
      />
    </div>
  );
}
