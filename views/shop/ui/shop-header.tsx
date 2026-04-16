import type { BoostNextTarget } from "@/features/shop/types";
import { QuizBoostPreviewBadge } from "./quiz-boost-preview-badge";

interface ShopHeaderProps {
  spendableXP: number;
  boostCharges: number;
  boostNextTarget: BoostNextTarget;
  isLoading: boolean;
}

export function ShopHeader({
  spendableXP,
  boostCharges,
  boostNextTarget,
  isLoading,
}: ShopHeaderProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-950">상점</h1>
          <p className="text-sm text-gray-500 mt-1">XP로 학습에 도움이 되는 아이템을 구매하세요</p>
          {boostCharges > 0 && (
            <div className="mt-3">
              <QuizBoostPreviewBadge
                charges={boostCharges}
                nextTarget={boostNextTarget}
              />
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-purple-600 font-medium mb-0.5">보유 XP</p>
          <p className="text-2xl font-bold text-purple-700">
            {isLoading ? "…" : `✨ ${spendableXP.toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
