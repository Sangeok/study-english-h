"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";
import type { PurchaseResponse, ShopPageData } from "@/features/shop/types";

export function useShopData() {
  return useQuery({
    queryKey: ["shop", "items"],
    queryFn: () => apiClient.get<ShopPageData>("/api/shop/items"),
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemCode: string) =>
      apiClient.post<PurchaseResponse>("/api/shop/purchase", { itemCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}
