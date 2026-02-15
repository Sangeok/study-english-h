"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StatsGrid } from "./stats-grid";
import { MasteryBreakdown } from "./mastery-breakdown";
import { countBy } from "@/shared/lib/array-utils";
import type { SessionResult } from "../../types";

function getResultEmoji(accuracy: number): string {
  if (accuracy >= 90) return "🎉";
  if (accuracy >= 80) return "🌟";
  if (accuracy >= 70) return "👍";
  if (accuracy >= 60) return "😊";
  return "💪";
}

function getResultMessage(accuracy: number): string {
  if (accuracy >= 90) return "완벽해요!";
  if (accuracy >= 80) return "훌륭해요!";
  if (accuracy >= 70) return "잘했어요!";
  if (accuracy >= 60) return "괜찮아요!";
  return "다시 도전해봐요!";
}

function getMotivationText(accuracy: number): string {
  if (accuracy >= 80) return "이 속도로 계속하면 곧 마스터할 수 있어요! 🚀";
  if (accuracy >= 60) return "꾸준히 학습하면 더 나아질 거예요! 📈";
  return "포기하지 마세요! 복습하면 반드시 향상됩니다! 💪";
}

export function SessionResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionResult] = useState<SessionResult>(() => {
    if (typeof window !== "undefined") {
      const storedResult = sessionStorage.getItem("flashcard-result");
      if (storedResult) {
        try {
          const parsed = JSON.parse(storedResult) as SessionResult;
          sessionStorage.removeItem("flashcard-result");
          return parsed;
        } catch (e) {
          console.error("Failed to parse session result:", e);
        }
      }
    }

    return {
      xp: Number(searchParams.get("xp") || 0),
      accuracy: Number(searchParams.get("accuracy") || 0),
      total: Number(searchParams.get("total") || 0),
      correct: Number(searchParams.get("correct") || 0),
    };
  });

  const { xp, accuracy, total, correct, results } = sessionResult;

  const masteryBreakdown = results ? countBy(results, r => r.masteryLevel) : {};

  const nextReviewDate =
    results && results.length > 0
      ? new Date(Math.min(...results.map((r) => new Date(r.nextReviewDate).getTime())))
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center space-y-4">
            <p className="text-7xl animate-bounce">{getResultEmoji(accuracy)}</p>
            <h1 className="text-3xl font-bold text-gray-800">{getResultMessage(accuracy)}</h1>
            <p className="text-gray-600">{getMotivationText(accuracy)}</p>
          </div>
        </div>

        <StatsGrid accuracy={accuracy} xp={xp} correct={correct} total={total} />

        {Object.keys(masteryBreakdown).length > 0 && (
          <MasteryBreakdown breakdown={masteryBreakdown} />
        )}

        {nextReviewDate && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-md text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📅</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">다음 복습 시간</h3>
                <p className="text-lg opacity-90">
                  {nextReviewDate.toLocaleDateString("ko-KR", {
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
