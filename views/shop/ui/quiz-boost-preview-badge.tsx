import type { BoostNextTarget } from "@/features/shop/types";

interface QuizBoostPreviewBadgeProps {
  charges: number;
  nextTarget: BoostNextTarget;
}

export function QuizBoostPreviewBadge({ charges, nextTarget }: QuizBoostPreviewBadgeProps) {
  if (charges === 0 || !nextTarget) return null;

  const targetLabel = nextTarget === "today_quiz" ? "오늘 퀴즈" : "내일 퀴즈";

  return (
    <div className="tactile-chip border-coral bg-paper text-ink">
      <span className="text-base">⚡</span>
      <span className="font-display font-bold text-coral-edge">2x</span>
      <span className="text-xs font-semibold text-ink-soft">
        충전 {charges}개 · {targetLabel}에 자동 적용
      </span>
    </div>
  );
}
