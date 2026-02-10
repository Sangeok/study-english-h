import type { QuizSummary } from "../../lib/quiz-api";

interface QuizHintStatsProps {
  hintStats: QuizSummary["hintStats"];
  correctBaseXP: number;
  xpEarned: number;
}

export function QuizHintStats({ hintStats, correctBaseXP, xpEarned }: QuizHintStatsProps) {
  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-purple-950">학습 통계</h3>
            <p className="text-sm text-purple-700">힌트 사용 패턴</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
            <span className="text-purple-900 font-medium">힌트 없이 정답</span>
            <span className="text-emerald-600 font-bold text-lg flex items-center gap-2">
              {hintStats.noHintCorrect}문제 <span className="text-xl">🌟</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <span className="text-purple-900 font-medium">상황 힌트 사용</span>
            <span className="text-amber-600 font-bold text-lg flex items-center gap-2">
              {hintStats.partialHintCorrect}문제 <span className="text-xl">📝</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200">
            <span className="text-purple-900 font-medium">전체 힌트 사용</span>
            <span className="text-violet-600 font-bold text-lg flex items-center gap-2">
              {hintStats.fullHintCorrect}문제 <span className="text-xl">🇰🇷</span>
            </span>
          </div>
        </div>

        {correctBaseXP > xpEarned && (
          <div className="mt-4 p-4 bg-violet-400/10 rounded-2xl border border-violet-400/20">
            <p className="text-sm text-purple-700 text-center">
              힌트 없이 풀었다면{" "}
              <span className="text-amber-600 font-bold text-base">+{correctBaseXP - xpEarned} XP</span> 더 받을 수
              있었어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
