"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Confetti } from "@/shared/ui";
import { apiClient, queryKeys } from "@/shared/lib";

interface DiagnosisResultData {
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: { category: string; accuracy: number }[];
  completedAt: string;
}

interface DiagnosisResultProps {
  diagnosisId: string;
}

async function fetchDiagnosisResult(diagnosisId: string): Promise<DiagnosisResultData> {
  return apiClient.get<DiagnosisResultData>(`/api/diagnosis/${diagnosisId}`);
}

const CEFR_INFO: Record<string, { title: string; description: string; color: string }> = {
  A1: {
    title: "Beginner",
    description: "기초 단계를 완성하고 있어요",
    color: "from-purple-400 to-purple-600",
  },
  A2: {
    title: "Elementary",
    description: "기본 회화가 가능한 단계예요",
    color: "from-purple-500 to-violet-600",
  },
  B1: {
    title: "Intermediate",
    description: "중급 수준의 대화가 가능해요",
    color: "from-violet-500 to-indigo-600",
  },
  B2: {
    title: "Upper Intermediate",
    description: "능숙한 영어 구사력을 갖췄어요",
    color: "from-violet-600 to-indigo-700",
  },
  C1: {
    title: "Advanced",
    description: "고급 수준의 영어 실력이에요",
    color: "from-indigo-600 to-purple-700",
  },
  C2: {
    title: "Proficiency",
    description: "원어민 수준의 유창함을 보여요",
    color: "from-indigo-700 to-purple-800",
  },
};

export function DiagnosisResult({ diagnosisId }: DiagnosisResultProps) {
  const router = useRouter();

  const {
    data: result,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.diagnosis.detail(diagnosisId),
    queryFn: () => fetchDiagnosisResult(diagnosisId),
    enabled: !!diagnosisId,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
          </div>
          <p className="text-lg font-medium text-purple-900">분석 중...</p>
          <p className="text-sm text-purple-700 mt-2">당신의 영어 레벨을 평가하고 있어요</p>
        </div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
            <span className="text-4xl">😞</span>
          </div>
          <h2 className="text-2xl font-bold text-purple-950 mb-3">결과를 불러올 수 없어요</h2>
          <p className="text-purple-700 mb-8">진단 결과를 가져오는 중 문제가 발생했습니다.</p>
          <button
            onClick={() => router.push("/diagnosis")}
            className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            다시 진단하기
          </button>
        </div>
      </div>
    );
  }

  const cefrInfo = CEFR_INFO[result.cefrLevel] || CEFR_INFO.A1;
  const scorePercentage = (result.totalScore / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden relative">
      <Confetti count={50} colors={["#a855f7", "#8b5cf6", "#6366f1", "#ec4899"]} delay={300} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "25s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "30s", animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mb-6 shadow-xl animate-bounce-gentle">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-purple-950 mb-3">진단 완료!</h1>
            <p className="text-lg md:text-xl text-purple-700">당신의 영어 여정이 시작됩니다</p>
          </div>

          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-200/30 to-transparent rounded-full -ml-24 -mb-24" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative flex-shrink-0">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#e9d5ff"
                        strokeWidth="12"
                        className="opacity-50"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${534 * (scorePercentage / 100)} 534`}
                        className="transition-all duration-2000 ease-out"
                        style={{ animation: "drawCircle 2s ease-out forwards" }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-display font-bold bg-gradient-to-br from-purple-600 to-violet-600 bg-clip-text text-transparent mb-1">
                          {result.cefrLevel}
                        </div>
                        <div className="text-sm font-semibold text-purple-700">{cefrInfo.title}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-4">
                      <span className="text-sm font-semibold text-purple-700">Your English Level</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-3">{cefrInfo.description}</h2>
                    <p className="text-lg text-purple-700 mb-6">
                      총 <span className="font-bold text-purple-900">{result.totalScore}점</span> 획득
                      <span className="text-purple-600"> / 100점</span>
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <div className="px-4 py-2 bg-white rounded-full shadow-md flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <span className="text-sm font-medium text-purple-900">진단 완료</span>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-full shadow-md flex items-center gap-2">
                        <span className="text-xl">⭐</span>
                        <span className="text-sm font-medium text-purple-900">+50 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {result.weaknessAreas.length > 0 && (
            <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-purple-950">집중 학습 영역</h3>
                    <p className="text-sm text-purple-700">이 영역을 개선하면 더 빠르게 성장할 수 있어요</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.weaknessAreas.map((area, idx) => {
                    const isWeak = area.accuracy < 60;
                    const colorClass = isWeak
                      ? "from-red-500 to-pink-600"
                      : area.accuracy < 75
                      ? "from-amber-500 to-orange-600"
                      : "from-green-500 to-emerald-600";

                    return (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 border border-purple-100"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-xl">{isWeak ? "📚" : area.accuracy < 75 ? "📖" : "✨"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-950 text-lg">{area.category}</span>
                              <p className="text-xs text-purple-700">
                                {isWeak ? "더 많은 연습이 필요해요" : area.accuracy < 75 ? "조금만 더 노력하면 완벽!" : "잘하고 있어요!"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-900">{Math.round(area.accuracy)}%</div>
                            <div className="text-xs text-purple-600">정확도</div>
                          </div>
                        </div>

                        <div className="relative h-3 bg-white rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-1000 ease-out`}
                            style={{
                              width: `${area.accuracy}%`,
                              animationDelay: `${idx * 0.1}s`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-5 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span>맞춤 학습 시작하기</span>
              <span className="text-2xl">🚀</span>
            </button>
            <button
              onClick={() => router.push("/main")}
              className="sm:w-48 py-5 bg-white/80 backdrop-blur-md text-purple-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-purple-200"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .duration-2000 {
          transition-duration: 2000ms;
        }

        .font-display {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }
      `}</style>
    </div>
  );
}
