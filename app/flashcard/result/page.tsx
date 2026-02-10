/**
 * Enhanced Flashcard Result Page
 *
 * Displays comprehensive session results with:
 * - Session statistics (accuracy, XP, time)
 * - Mastery level breakdown
 * - Next review guidance
 * - Multiple navigation options
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface SessionResult {
  xp: number;
  accuracy: number;
  total: number;
  correct: number;
  results?: Array<{
    vocabularyId: string;
    masteryLevel: string;
    nextReviewDate: string;
  }>;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    // Try to get full result from sessionStorage first
    const storedResult = sessionStorage.getItem("flashcard-result");
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setSessionResult(parsed);
        // Clear after reading
        sessionStorage.removeItem("flashcard-result");
        return;
      } catch (e) {
        console.error("Failed to parse session result:", e);
      }
    }

    // Fallback to URL params
    setSessionResult({
      xp: Number(searchParams.get("xp") || 0),
      accuracy: Number(searchParams.get("accuracy") || 0),
      total: Number(searchParams.get("total") || 0),
      correct: Number(searchParams.get("correct") || 0),
    });
  }, [searchParams]);

  if (!sessionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const { xp, accuracy, total, correct, results } = sessionResult;

  // Calculate mastery level breakdown
  const masteryBreakdown = results
    ? results.reduce(
        (acc, r) => {
          acc[r.masteryLevel] = (acc[r.masteryLevel] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  // Find nearest review date
  const nextReviewDate = results
    ? new Date(
        Math.min(
          ...results.map((r) => new Date(r.nextReviewDate).getTime())
        )
      )
    : null;

  // Determine emoji and message based on accuracy
  const getEmoji = () => {
    if (accuracy >= 90) return "🎉";
    if (accuracy >= 80) return "🌟";
    if (accuracy >= 70) return "👍";
    if (accuracy >= 60) return "😊";
    return "💪";
  };

  const getMessage = () => {
    if (accuracy >= 90) return "완벽해요!";
    if (accuracy >= 80) return "훌륭해요!";
    if (accuracy >= 70) return "잘했어요!";
    if (accuracy >= 60) return "괜찮아요!";
    return "다시 도전해봐요!";
  };

  const getMotivation = () => {
    if (accuracy >= 80) return "이 속도로 계속하면 곧 마스터할 수 있어요! 🚀";
    if (accuracy >= 60) return "꾸준히 학습하면 더 나아질 거예요! 📈";
    return "포기하지 마세요! 복습하면 반드시 향상됩니다! 💪";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center space-y-4">
            <p className="text-7xl animate-bounce">{getEmoji()}</p>
            <h1 className="text-3xl font-bold text-gray-800">{getMessage()}</h1>
            <p className="text-gray-600">{getMotivation()}</p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-200">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-blue-700">정확도</p>
              <p className="text-4xl font-bold text-blue-900">{accuracy.toFixed(1)}%</p>
              <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </div>

          {/* XP Earned */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-purple-200">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-purple-700">획득 XP</p>
              <p className="text-4xl font-bold text-purple-900">+{xp}</p>
              <p className="text-xs text-purple-600">단어당 5 XP</p>
            </div>
          </div>

          {/* Correct Count */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-green-200">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-green-700">정답</p>
              <p className="text-4xl font-bold text-green-900">{correct}</p>
              <p className="text-xs text-green-600">{total}문제 중</p>
            </div>
          </div>

          {/* Total Count */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-orange-200">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-orange-700">전체</p>
              <p className="text-4xl font-bold text-orange-900">{total}</p>
              <p className="text-xs text-orange-600">학습 완료</p>
            </div>
          </div>
        </div>

        {/* Mastery Level Breakdown */}
        {Object.keys(masteryBreakdown).length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">숙달도 분석</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {masteryBreakdown.new && (
                <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl mb-1">🆕</p>
                    <p className="text-sm text-gray-600 mb-1">새로운 단어</p>
                    <p className="text-2xl font-bold text-gray-800">{masteryBreakdown.new}</p>
                  </div>
                </div>
              )}
              {masteryBreakdown.learning && (
                <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200">
                  <div className="text-center">
                    <p className="text-2xl mb-1">📖</p>
                    <p className="text-sm text-yellow-700 mb-1">학습 중</p>
                    <p className="text-2xl font-bold text-yellow-800">{masteryBreakdown.learning}</p>
                  </div>
                </div>
              )}
              {masteryBreakdown.reviewing && (
                <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl mb-1">🔄</p>
                    <p className="text-sm text-blue-700 mb-1">복습 중</p>
                    <p className="text-2xl font-bold text-blue-800">{masteryBreakdown.reviewing}</p>
                  </div>
                </div>
              )}
              {masteryBreakdown.mastered && (
                <div className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
                  <div className="text-center">
                    <p className="text-2xl mb-1">✨</p>
                    <p className="text-sm text-green-700 mb-1">숙달</p>
                    <p className="text-2xl font-bold text-green-800">{masteryBreakdown.mastered}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Review Guidance */}
        {nextReviewDate && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-md text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📅</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">다음 복습 시간</h3>
                <p className="text-lg opacity-90">
                  {new Date(nextReviewDate).toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm opacity-75 mt-1">
                  SRS 알고리즘에 따라 최적의 복습 시간이 계산되었습니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-3xl p-8 shadow-md space-y-3">
          <h2 className="text-xl font-bold text-gray-800 mb-4">다음 행동</h2>

          <button
            onClick={() => router.push("/flashcard?mode=review")}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-semibold shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>복습 계속하기</span>
          </button>

          <button
            onClick={() => router.push("/flashcard?mode=new")}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🆕</span>
            <span>새로운 단어 학습</span>
          </button>

          <button
            onClick={() => router.push("/flashcard/modes")}
            className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>학습 모드 변경</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>홈으로</span>
          </button>
        </div>

        {/* Learning Tips */}
        <div className="bg-white rounded-3xl p-8 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">학습 팁</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>매일 조금씩 복습하면 장기 기억에 효과적입니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>어려운 단어는 여러 번 반복하여 학습하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>SRS 알고리즘이 최적의 복습 시간을 알려드립니다</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">결과를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
