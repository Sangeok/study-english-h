import { Store } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-[28px] border border-gold-edge bg-gold p-8 text-ink animate-[pop-in]">
      {/* Decorative depth */}
      <div className="absolute -right-12 -top-14 h-52 w-52 rounded-full bg-ink/5" />
      <div className="absolute right-16 -bottom-12 h-32 w-32 rounded-full bg-ink/5" />
      <div
        className="absolute left-8 top-8 h-2.5 w-2.5 rounded-full bg-ink/30"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="tactile-tile mb-4 h-12 w-12 border-ink/15 bg-ink/10 text-ink">
            <Store className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            상점
          </h1>
          <p className="mt-1 text-sm font-medium text-ink/70">
            XP로 학습에 도움이 되는 아이템을 구매할 수 있어요
          </p>
          {boostCharges > 0 && (
            <div className="mt-4">
              <QuizBoostPreviewBadge
                charges={boostCharges}
                nextTarget={boostNextTarget}
              />
            </div>
          )}
        </div>

        {/* Currency balance hero */}
        <div className="sm:text-right">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
            Spendable XP
          </p>
          <p className="font-display text-5xl font-bold leading-none tabular-nums text-ink md:text-6xl">
            {isLoading ? "—" : spendableXP.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/55">
            보유 XP
          </p>
        </div>
      </div>
    </div>
  );
}
