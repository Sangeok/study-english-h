import type { QuizResult } from "../lib/quiz-api";

interface QuizDetailResultsProps {
  results: QuizResult[];
  showDetails: boolean;
  onToggle: () => void;
}

export function QuizDetailResults({ results, showDetails, onToggle }: QuizDetailResultsProps) {
  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-purple-950">상세 결과</h3>
              <p className="text-sm text-purple-700">문제별 정답 확인</p>
            </div>
          </div>
          <button onClick={onToggle} className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-xl text-purple-900 font-medium transition-colors">
            {showDetails ? "숨기기" : "보기"}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-3 animate-expand">
            {results.map((item, idx) => {
              const isCorrect = item.isCorrect;
              const bgColor = isCorrect ? "from-emerald-50 to-green-50" : "from-rose-50 to-pink-50";
              const borderColor = isCorrect ? "border-emerald-200" : "border-rose-200";
              const iconBg = isCorrect
                ? "bg-gradient-to-br from-emerald-500 to-green-600"
                : "bg-gradient-to-br from-rose-500 to-pink-600";

              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${bgColor} rounded-2xl p-5 border ${borderColor} hover:shadow-lg transition-all duration-300`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold text-lg">{idx + 1}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-950">문제 {idx + 1}</span>
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                            isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          <span className="text-lg">{isCorrect ? "✓" : "✗"}</span>
                          <span className="text-sm font-semibold">{isCorrect ? "정답" : "오답"}</span>
                        </div>
                      </div>

                      {!isCorrect && item.correctAnswer && (
                        <div className="mb-2 p-3 bg-white/50 rounded-xl">
                          <span className="text-sm font-semibold text-purple-900">정답: </span>
                          <span className="text-sm text-purple-800">{item.correctAnswer}</span>
                        </div>
                      )}

                      <div className="text-sm text-purple-700 leading-relaxed">{item.explanation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }

        .animate-expand {
          animation: expand 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
