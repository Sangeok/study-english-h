import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUALITY_RESULT_CARDS, QUALITY_RESULT_ORDER } from "../../config";
import type { QualityBreakdown } from "../../types";

interface QualityBreakdownCardProps {
  breakdown: QualityBreakdown;
}

export function QualityBreakdownCard({ breakdown }: QualityBreakdownCardProps) {
  return (
    <div className="tactile-card p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="tactile-tile h-11 w-11 border-ocean bg-ocean-tint text-ocean-edge">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-ink">내가 매긴 난이도</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            평가가 쌓이면서 복습 간격이 벌어져요 — 잊음은 내일 다시 나와요.
          </p>
        </div>
      </div>
      {/* 0인 항목도 남긴다 — 분포에 구멍이 생기면 무엇을 안 눌렀는지 알 수 없다. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {QUALITY_RESULT_ORDER.map((quality, idx) => {
          const card = QUALITY_RESULT_CARDS[quality];
          const count = breakdown[quality];

          return (
            <div
              key={quality}
              style={{ animationDelay: `${idx * 70}ms` }}
              className={cn(
                "rounded-[20px] border p-4 text-center animate-[pop-in]",
                card.bgColor,
                card.borderColor,
                count === 0 && "opacity-60"
              )}
            >
              <p className={cn("mb-1 text-xs font-bold uppercase tracking-wide", card.sublabelColor)}>
                {card.label}
              </p>
              <p className={cn("font-display text-3xl font-bold tabular-nums", card.textColor)}>
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
