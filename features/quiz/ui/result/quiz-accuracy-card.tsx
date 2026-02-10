import type { QuizSummary } from "../../lib/quiz-api";

interface QuizAccuracyCardProps {
  summary: QuizSummary;
  xpCounter: number;
}

export function QuizAccuracyCard({ summary, xpCounter }: QuizAccuracyCardProps) {
  const accuracyPercentage = summary.accuracy;

  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-200/30 to-transparent rounded-full -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center">
              <div className="relative w-56 h-56">
                <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#e9d5ff"
                    strokeWidth="14"
                    className="opacity-30"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="url(#accuracyGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${534 * (accuracyPercentage / 100)} 534`}
                    className="transition-all duration-2000 ease-out"
                    style={{
                      animation: "drawCircle 2s ease-out forwards",
                      filter: accuracyPercentage >= 80 ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))" : "none",
                    }}
                  />
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-display font-bold bg-gradient-to-br from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                    {summary.accuracy}%
                  </div>
                  <div className="text-sm font-semibold text-purple-700">정확도</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-lg font-medium text-purple-900">
                  {summary.correct} / {summary.total} 정답
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 border border-amber-200 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md">
                    <span className="text-3xl">💎</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-700 mb-1">획득 XP</div>
                    <div className="text-4xl font-bold text-orange-900 animate-count-up">+{xpCounter}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-md text-center border border-purple-100">
                  <div className="text-3xl mb-1">⚡</div>
                  <div className="text-xs text-purple-700 font-medium">완료</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center border border-purple-100">
                  <div className="text-3xl mb-1">🔥</div>
                  <div className="text-xs text-purple-700 font-medium">연속 7일</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md text-center border border-purple-100">
                  <div className="text-3xl mb-1">⭐</div>
                  <div className="text-xs text-purple-700 font-medium">레벨업</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes count-up {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-count-up {
          animation: count-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
