"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { DashboardHero } from "./dashboard-hero";
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
        <div className="bg-muted-warm rounded-2xl h-[320px] animate-pulse" />
        <div className="bg-muted-warm rounded-2xl h-[320px] animate-pulse" />
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
    <div className="min-h-screen bg-cream-canvas py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 히어로 — 레벨/스트릭/오늘의 퀴즈 */}
        <DashboardHero
          level={profile?.level ?? "A1"}
          streak={profile?.streak ?? 0}
          totalXP={profile?.totalXP ?? 0}
          hasCompletedDiagnosis={profile?.hasCompletedDiagnosis ?? false}
        />

        {/* 벤토 통계 타일 */}
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
