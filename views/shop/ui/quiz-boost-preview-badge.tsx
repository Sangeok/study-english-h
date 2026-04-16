import type { BoostNextTarget } from "@/features/shop/types";

interface QuizBoostPreviewBadgeProps {
  charges: number;
  nextTarget: BoostNextTarget;
}

export function QuizBoostPreviewBadge({ charges, nextTarget }: QuizBoostPreviewBadgeProps) {
  if (charges === 0 || !nextTarget) return null;

  const targetLabel = nextTarget === "today_quiz" ? "오늘 퀴즈" : "내일 퀴즈";

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-full px-3 py-1">
      <span className="text-sm">⚡</span>
      <span className="text-xs font-semibold text-amber-900">
        2x 충전 {charges}개 · {targetLabel}에 자동 적용
      </span>
    </div>
  );
}
