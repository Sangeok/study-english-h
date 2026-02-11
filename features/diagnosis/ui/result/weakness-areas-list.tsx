import { cn } from "@/lib/utils";
import { getAccuracyStyle, ACCURACY_THRESHOLDS } from "../../constants";

interface WeaknessAreasListProps {
  weaknessAreas: { category: string; accuracy: number }[];
}

export function WeaknessAreasList({ weaknessAreas }: WeaknessAreasListProps) {
  if (weaknessAreas.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <p className="text-purple-700 font-medium">
          약점 영역이 없어요! 꾸준히 학습을 이어가세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-xl font-display font-bold text-purple-950">
        집중 학습 영역
      </h3>
      {weaknessAreas.map((area) => {
        const style = getAccuracyStyle(area.accuracy);
        const isWeak = area.accuracy < ACCURACY_THRESHOLDS.WEAK;

        return (
          <div
            key={area.category}
            className={cn("p-4 rounded-2xl border", style.bg, style.border)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-900">
                {area.category}
              </span>
              <span className="text-sm font-semibold">
                {Math.round(area.accuracy)}%
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  style.gradient
                )}
                style={{ width: `${area.accuracy}%` }}
              />
            </div>
            {isWeak && (
              <p className="text-xs mt-2 text-purple-600">
                {style.emoji} {style.label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
