/**
 * Weakness Areas Component
 * 사용자의 약점 영역을 시각적으로 표시
 */

"use client";

interface WeaknessAreasProps {
  weaknessAreas: Record<string, number> | null;
  className?: string;
}

export function WeaknessAreas({ weaknessAreas, className = "" }: WeaknessAreasProps) {
  if (!weaknessAreas || Object.keys(weaknessAreas).length === 0) {
    return (
      <div className={`bg-white rounded-3xl p-8 shadow-md ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl">🎉</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-purple-950 mb-2">약점 영역 없음</h3>
            <p className="text-sm text-purple-700">모든 영역에서 우수한 성적을 거두고 있습니다!</p>
          </div>
        </div>
      </div>
    );
  }

  // 약점 영역을 정확도 낮은 순으로 정렬
  const sortedWeaknesses = Object.entries(weaknessAreas).sort(([, a], [, b]) => a - b);

  // 정확도에 따른 색상 결정
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "bg-green-500";
    if (accuracy >= 60) return "bg-yellow-500";
    if (accuracy >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return "bg-green-50 border-green-200";
    if (accuracy >= 60) return "bg-yellow-50 border-yellow-200";
    if (accuracy >= 40) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className={`bg-white rounded-3xl p-8 shadow-md ${className}`}>
      <div className="mb-6">
        <h3 className="font-display font-bold text-2xl text-purple-950 mb-2">집중 학습 영역</h3>
        <p className="text-sm text-purple-700">아래 영역들을 중점적으로 학습하면 더 빠르게 성장할 수 있어요</p>
      </div>

      <div className="space-y-4">
        {sortedWeaknesses.map(([category, accuracy]) => (
          <div
            key={category}
            className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-102 ${getAccuracyBgColor(
              accuracy
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-purple-950">{category}</span>
              <span className="text-sm font-bold text-purple-700">{accuracy.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getAccuracyColor(accuracy)}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-purple-600">
              {accuracy < 60 ? "⚠️ 집중 학습 필요" : accuracy < 80 ? "💪 조금 더 노력" : "✅ 잘하고 있어요"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-950 mb-1">학습 팁</h4>
            <p className="text-sm text-purple-700">
              일일 퀴즈에서는 약점 영역의 문제가 50% 더 많이 출제됩니다. 꾸준히 학습하면 빠르게 개선할 수 있어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
