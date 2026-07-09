import { BarChart3 } from "lucide-react";
import type { QuizSummary } from "../../types";

interface QuizHintStatsProps {
  hintStats: QuizSummary["hintStats"];
  xpPenaltyFromHints: number; // v2 신규 — route가 pre-compute (부스트 배수 반영된 값)
  isExtraPractice: boolean;
}

export function QuizHintStats({ hintStats, xpPenaltyFromHints, isExtraPractice }: QuizHintStatsProps) {
  // (T2) pre-existing 버그 수정: 기존 `correctBaseXP > xpEarned`는 보너스 XP가 포함된 xpEarned로
  //   인해 항상 false였음. xpPenaltyFromHints가 서버에서 직접 계산되어 정확히 작동한다.
  const hasXpGap = !isExtraPractice && xpPenaltyFromHints > 0;
  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="tactile-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="tactile-tile w-12 h-12 bg-teal border-teal-edge text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">학습 통계</h3>
            <p className="text-sm text-ink-soft">힌트 사용 패턴</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-teal-tint rounded-2xl border border-teal">
            <span className="text-ink font-medium">힌트 없이 정답</span>
            <span className="text-teal-edge font-display font-bold tabular-nums text-lg">
              {hintStats.noHintCorrect}문제
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gold-tint rounded-2xl border border-gold">
            <span className="text-ink font-medium">상황 힌트 사용</span>
            <span className="text-gold-edge font-display font-bold tabular-nums text-lg">
              {hintStats.partialHintCorrect}문제
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-ocean-tint rounded-2xl border border-ocean">
            <span className="text-ink font-medium">전체 힌트 사용</span>
            <span className="text-ocean-edge font-display font-bold tabular-nums text-lg">
              {hintStats.fullHintCorrect}문제
            </span>
          </div>
        </div>

        {hasXpGap && (
          <div className="mt-4 p-4 bg-muted-warm rounded-2xl border border-border-warm">
            <p className="text-sm text-ink-soft text-center">
              힌트 없이 풀었다면{" "}
              <span className="text-gold-edge font-display font-bold tabular-nums text-base">+{xpPenaltyFromHints} XP</span> 더 받을 수
              있었어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
