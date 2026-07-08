import { cn } from "@/lib/utils";
import { StatCard } from "@/shared/ui";
import { WeaknessAreas, normalizeWeaknessAreas } from "@/features/diagnosis";
import { SectionWrapper } from "./section-wrapper";

interface ProgressSectionProps {
  totalXP: number;
  streak: number;
  level: string;
  weaknessAreas: Record<string, number> | null | undefined;
  isLoading: boolean;
  diagnosisCompleted: boolean;
  onViewAllStats: () => void;
}

export function ProgressSection({
  totalXP,
  streak,
  level,
  weaknessAreas,
  isLoading,
  diagnosisCompleted,
  onViewAllStats
}: ProgressSectionProps) {
  const levelDisplay = diagnosisCompleted ? level : "미진단";
  const levelFooter = diagnosisCompleted
    ? "진단 기반 맞춤 학습"
    : "레벨 진단을 완료해주세요";

  return (
    <SectionWrapper aria-label="학습 진행률">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h3 className="text-3xl md:text-4xl font-display font-bold text-ink mb-2">
            학습 진행률
          </h3>
          <p className="text-ink-soft">계속 화이팅!</p>
        </div>
        <button
          onClick={onViewAllStats}
          className="font-bold text-teal-edge hover:text-teal transition-colors"
        >
          모든 통계 보기 →
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="⭐"
          label="총 경험치"
          value={totalXP.toLocaleString()}
          tone="gold"
          isLoading={isLoading}
          footer={
            <div className="flex items-center gap-2 text-sm text-gold-edge">
              <span className="font-semibold">학습하며 XP를 모으세요!</span>
            </div>
          }
        />

        <StatCard
          icon="🔥"
          label="연속 학습"
          value={`${streak ?? 0}일`}
          tone="coral"
          isLoading={isLoading}
          footer={
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-2.5 rounded-full border",
                    i < streak && "bg-coral border-coral-edge",
                    i >= streak && "bg-muted-warm border-border-warm"
                  )}
                />
              ))}
            </div>
          }
        />

        <StatCard
          icon="🏆"
          label="현재 레벨"
          value={levelDisplay}
          tone="ocean"
          isLoading={isLoading}
          footer={
            <div className="flex items-center gap-2 text-sm text-ocean-edge">
              <span className="font-semibold">{levelFooter}</span>
            </div>
          }
        />
      </div>

      {/* Weakness Areas Section */}
      {diagnosisCompleted && !isLoading && (
        <div className="mt-8">
          <WeaknessAreas weaknessAreas={normalizeWeaknessAreas(weaknessAreas)} />
        </div>
      )}
    </SectionWrapper>
  );
}
