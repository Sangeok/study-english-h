"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { OverviewStats } from "./overview-stats";
import { GamificationSummary } from "./gamification-summary";
import { StudySummarySection } from "./study-summary-section";
import { ReviewNeededBanner } from "./review-needed-banner";

// recharts는 SSR 비호환 — 동적 import로 클라이언트 전용 로드
const PeriodChartSection = dynamic(
  () => import("./period-chart-section").then((m) => ({ default: m.PeriodChartSection })),
  {
    ssr: false,
    loading: () => (
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-100 rounded-2xl h-[320px] animate-pulse" />
        <div className="bg-gray-100 rounded-2xl h-[320px] animate-pulse" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [period, setPeriod] = useState("week");
  const {
    profile,
    periodStats,
    league,
    isProfileLoading,
    isPeriodLoading,
    isLeagueLoading,
  } = useDashboardData(period);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-950 mb-2">대시보드</h1>
          <p className="text-purple-800/70">학습 진행 상황을 한눈에 확인하세요</p>
        </div>

        {/* 주요 통계 카드 */}
        <OverviewStats
          totalXP={profile?.totalXP ?? 0}
          streak={profile?.streak ?? 0}
          level={profile?.level ?? "A1"}
          totalWordLearned={profile?.totalWordLearned ?? 0}
          masteredWords={profile?.masteredWords ?? 0}
          longestStreak={profile?.longestStreak ?? 0}
          hasCompletedDiagnosis={profile?.hasCompletedDiagnosis ?? false}
          isLoading={isProfileLoading}
        />

        {/* 게이미피케이션 요약 */}
        <GamificationSummary
          leagueTier={league?.tier ?? 1}
          leaguePoints={league?.leaguePoints ?? 0}
          isLoading={isLeagueLoading}
        />

        {/* 복습 필요 알림 */}
        {profile && profile.reviewNeeded > 0 && (
          <ReviewNeededBanner count={profile.reviewNeeded} />
        )}

        {/* 기간별 차트 */}
        <PeriodChartSection
          periodStats={periodStats}
          isLoading={isPeriodLoading}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* 학습 통계 요약 */}
        <StudySummarySection
          period={period}
          totalQuizzes={periodStats?.totalQuizzes ?? 0}
          quizAccuracy={periodStats?.quizAccuracy ?? 0}
          quizStudyTimeSec={periodStats?.quizStudyTimeSec ?? 0}
          totalFlashcardSessions={periodStats?.totalFlashcardSessions ?? 0}
          flashcardStudyTimeSec={periodStats?.flashcardStudyTimeSec ?? 0}
        />
      </div>
    </div>
  );
}
