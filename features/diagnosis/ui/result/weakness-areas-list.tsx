import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCURACY_THRESHOLDS } from "../../config";
import { getAccuracyFeedback } from "../../lib/accuracy-feedback";
import type { WeaknessArea } from "../../types";

interface WeaknessAreasListProps {
  weaknessAreas: WeaknessArea[];
}

interface WeaknessAreasProps {
  weaknessAreas: WeaknessArea[];
  className?: string;
}

type AccuracyTone = "teal" | "gold" | "coral";

// 정확도 → 택타일 톤 (배너밴된 그라데이션 대신 단색 토큰)
function getAccuracyTone(accuracy: number): AccuracyTone {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) return "teal";
  if (accuracy >= ACCURACY_THRESHOLDS.WEAK) return "gold";
  return "coral";
}

const TONE_CARD: Record<AccuracyTone, string> = {
  teal: "border-teal bg-teal-tint",
  gold: "border-gold bg-gold-tint",
  coral: "border-coral bg-coral-tint",
};

const TONE_EDGE: Record<AccuracyTone, string> = {
  teal: "var(--teal)",
  gold: "var(--gold)",
  coral: "var(--coral)",
};

const TONE_TEXT: Record<AccuracyTone, string> = {
  teal: "text-teal-edge",
  gold: "text-gold-edge",
  coral: "text-coral-edge",
};

function WeaknessAreaContent({ weaknessAreas }: WeaknessAreasListProps) {
  if (weaknessAreas.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="tactile-tile mx-auto mb-4 h-16 w-16 border-teal-edge bg-teal text-white">
          <Check className="h-7 w-7" />
        </div>
        <p className="font-medium text-ink">
          약점 영역이 없습니다. 현재 학습 흐름을 유지해 주세요.
        </p>
      </div>
    );
  }

  const sortedWeaknessAreas = [...weaknessAreas].sort(
    (left, right) => left.accuracy - right.accuracy
  );

  return (
    <div className="mb-8 space-y-4">
      <h3 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">집중 학습 영역</h3>
      {sortedWeaknessAreas.map((area, idx) => {
        const feedback = getAccuracyFeedback(area.accuracy);
        const tone = getAccuracyTone(area.accuracy);
        const isWeak = area.accuracy < ACCURACY_THRESHOLDS.WEAK;

        return (
          <div
            key={area.category}
            className={cn(
              "animate-slide-up rounded-2xl border p-4",
              TONE_CARD[tone]
            )}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-ink">{area.category}</span>
              <span
                className={cn("font-display text-lg font-bold tabular-nums", TONE_TEXT[tone])}
              >
                {Math.round(area.accuracy)}%
              </span>
            </div>
            <div className="tactile-progress h-2.5">
              <div
                className="tactile-progress__fill"
                style={{
                  width: `${area.accuracy}%`,
                  background: TONE_EDGE[tone],
                }}
              />
            </div>
            {isWeak && (
              <p className={cn("mt-2 text-xs font-medium", TONE_TEXT[tone])}>
                {feedback}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WeaknessAreasList({ weaknessAreas }: WeaknessAreasListProps) {
  return <WeaknessAreaContent weaknessAreas={weaknessAreas} />;
}

export function WeaknessAreas({ weaknessAreas, className }: WeaknessAreasProps) {
  return (
    <div className={cn("tactile-card p-6 md:p-8", className)}>
      <WeaknessAreaContent weaknessAreas={weaknessAreas} />
    </div>
  );
}
