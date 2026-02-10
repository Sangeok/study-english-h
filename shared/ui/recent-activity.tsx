/**
 * Recent Activity Component
 * 최근 학습 활동 표시
 */

"use client";

import { useRecentActivity, type Activity } from "@/shared/lib";

interface RecentActivityProps {
  className?: string;
  limit?: number;
}

export function RecentActivity({ className = "", limit = 7 }: RecentActivityProps) {
  const { data, isLoading, error } = useRecentActivity(limit);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-3xl p-8 shadow-md ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.activities.length === 0) {
    return (
      <div className={`bg-white rounded-3xl p-8 shadow-md ${className}`}>
        <h3 className="font-display font-bold text-2xl text-purple-950 mb-6">최근 학습 기록</h3>
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl">📚</span>
          </div>
          <p className="text-purple-700">아직 학습 기록이 없습니다</p>
          <p className="text-sm text-purple-600">퀴즈나 플래시카드로 학습을 시작해보세요!</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    }
  };

  const renderActivity = (activity: Activity) => {
    if (activity.type === "quiz") {
      const accuracy = Math.round((activity.correctAnswers / activity.totalQuestions) * 100);
      const avgTime = Math.round(activity.totalTime / activity.totalQuestions);

      return (
        <div
          key={`${activity.type}-${activity.date}`}
          className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎮</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-purple-950">일일 퀴즈</h4>
                <span className="text-xs text-purple-600">{formatDate(activity.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-purple-700">
                <span>
                  {activity.correctAnswers}/{activity.totalQuestions}문제
                </span>
                <span className="font-semibold text-purple-800">{accuracy}% 정확도</span>
                <span>평균 {avgTime}초</span>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                accuracy >= 80
                  ? "bg-green-100 text-green-700"
                  : accuracy >= 60
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {accuracy >= 80 ? "훌륭해요!" : accuracy >= 60 ? "괜찮아요" : "힘내세요"}
            </div>
          </div>
        </div>
      );
    } else {
      // flashcard
      const minutes = Math.floor(activity.duration / 60);
      const { qualityCounts } = activity;
      const hasQualityCounts =
        qualityCounts.easy + qualityCounts.normal + qualityCounts.hard + qualityCounts.forgot > 0;

      return (
        <div
          key={`${activity.type}-${activity.date}`}
          className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🃏</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-purple-950">플래시카드</h4>
                <span className="text-xs text-purple-600">{formatDate(activity.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-purple-700">
                <span>{activity.vocabularyCount}개 단어</span>
                <span>{minutes}분 학습</span>
              </div>
              {hasQualityCounts && (
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {qualityCounts.easy > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      😊 {qualityCounts.easy}
                    </span>
                  )}
                  {qualityCounts.normal > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      ✓ {qualityCounts.normal}
                    </span>
                  )}
                  {qualityCounts.hard > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      😓 {qualityCounts.hard}
                    </span>
                  )}
                  {qualityCounts.forgot > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      ✗ {qualityCounts.forgot}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-8 shadow-md ${className}`}>
      <div className="mb-6">
        <h3 className="font-display font-bold text-2xl text-purple-950 mb-2">최근 학습 기록</h3>
        <p className="text-sm text-purple-700">최근 {data.activities.length}개의 학습 활동</p>
      </div>

      <div className="space-y-3">{data.activities.map(renderActivity)}</div>

      {data.activities.length >= limit && (
        <div className="mt-6 text-center">
          <button className="text-purple-600 font-semibold hover:text-purple-700 transition-colors text-sm">
            더 보기 →
          </button>
        </div>
      )}
    </div>
  );
}
