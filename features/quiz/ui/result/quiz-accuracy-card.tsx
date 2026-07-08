import { cn } from "@/lib/utils";
import type { QuizSummary } from "../../types";
import type { GamificationResult } from "@/entities/gamification";

interface QuizAccuracyCardProps {
  summary: QuizSummary;
  xpCounter: number;
  isExtraPractice: boolean;
  currentStreak: number;
  gamification?: GamificationResult;
}

// 정확도 링 지오메트리 — strokeDasharray는 원주(2πr)에서 유도 (diagnosis의 SVG_CIRCLE 패턴과 동일)
const SVG_CIRCLE = {
  RADIUS: 85,
  CIRCUMFERENCE: Math.round(2 * Math.PI * 85), // 534
} as const;

function getCircleFilter(accuracy: number): string {
  if (accuracy >= 80) {
    return "drop-shadow(0 0 8px rgba(46, 107, 255, 0.35))";
  }

  return "none";
}

function getStreakLabel(currentStreak: number): string {
  if (currentStreak >= 2) return `연속 ${currentStreak}일`;
  return "첫 걸음";
}

function getRewardLabel(gamification?: GamificationResult): string {
  if (!gamification) {
    return "추가 연습";
  }

  if (gamification.promoted && gamification.newTierName) {
    return `${gamification.newTierName} 승급`;
  }

  if (gamification.milestones.length > 0) {
    return "마일스톤 달성";
  }

  return `+${gamification.leaguePoints}LP`;
}

function XpCard({ xpCounter }: { xpCounter: number }) {
  return (
    <div className="p-2">
      <div className="text-sm font-semibold text-ink-soft mb-1">획득 XP</div>
      <div className="text-5xl font-display font-bold tabular-nums text-gold-edge animate-quiz-count-up">
        +{xpCounter}
      </div>
    </div>
  );
}

function NoXpCard() {
  return (
    <div className="rounded-2xl border border-border-warm bg-muted-warm p-6">
      <div className="text-sm font-semibold text-ink-soft mb-1">추가 연습</div>
      <div className="text-base font-bold text-ink">XP 없음</div>
      <div className="text-xs text-ink-soft/70 mt-0.5">첫 완료 시에만 XP가 적립됩니다</div>
    </div>
  );
}

export function QuizAccuracyCard({ summary, xpCounter, isExtraPractice, currentStreak, gamification }: QuizAccuracyCardProps) {
  const accuracyPercentage = summary.accuracy;
  const circleFilter = getCircleFilter(accuracyPercentage);
  const streakLabel = getStreakLabel(currentStreak);
  const rewardLabel = getRewardLabel(gamification);
  const isRewardMuted = !gamification;

  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="tactile-card tactile-card--raised p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-coral/10 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center">
              <div className="relative w-56 h-56">
                <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={SVG_CIRCLE.RADIUS}
                    fill="none"
                    stroke="var(--border-warm)"
                    strokeWidth="14"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={SVG_CIRCLE.RADIUS}
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${SVG_CIRCLE.CIRCUMFERENCE * (accuracyPercentage / 100)} ${SVG_CIRCLE.CIRCUMFERENCE}`}
                    className="transition-all duration-2000 ease-out"
                    style={{
                      animation: "drawCircle 2s ease-out forwards",
                      filter: circleFilter,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-display font-bold tabular-nums text-teal mb-2">
                    {summary.accuracy}%
                  </div>
                  <div className="text-sm font-semibold text-ink-soft">정확도</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-lg font-medium tabular-nums text-ink">
                  {summary.correct} / {summary.total} 정답
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {isExtraPractice && <NoXpCard />}
              {!isExtraPractice && <XpCard xpCounter={xpCounter} />}

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border-warm bg-paper p-4 text-center">
                  <div className="text-xs font-semibold text-ink-soft">완료</div>
                </div>
                <div className="rounded-2xl border border-coral bg-coral-tint p-4 text-center">
                  <div className="text-xs font-semibold tabular-nums text-coral-edge">{streakLabel}</div>
                </div>
                <div className={cn(
                  "rounded-2xl p-4 text-center border",
                  isRewardMuted ? "bg-muted-warm border-border-warm" : "bg-gold-tint border-gold",
                )}>
                  <div className={cn(
                    "text-xs font-semibold tabular-nums",
                    isRewardMuted ? "text-ink-soft/70" : "text-gold-edge",
                  )}>{rewardLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

