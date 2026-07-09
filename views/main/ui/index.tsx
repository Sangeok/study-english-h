"use client";

import { useDiagnosisStatus, WeaknessAreas, normalizeWeaknessAreas } from "@/features/diagnosis";
import { ApiError } from "@/shared/lib";
import { useProfileStats } from "@/entities/user/model/use-profile-stats";
import { useMainPageHandlers } from "../hooks/use-main-page-handlers";
import { useDiagnosisToast } from "../hooks/use-diagnosis-toast";
import { HomeHero } from "./home-hero";
import { ReportSection } from "./report-section";
import { MetricsStrip } from "./metrics-strip";
import { ActivityList } from "./activity-list";

interface MainPageProps {
  isAuthenticated: boolean;
}

const DEFAULT_STATS = {
  totalXP: 0,
  streak: 0,
  totalWordLearned: 0,
  vocabularyProgress: 0,
  level: "A1",
} as const;

function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export default function MainPage({ isAuthenticated }: MainPageProps) {
  const {
    data: diagnosisStatus,
    isLoading: diagnosisLoading,
    isError: diagnosisFailed,
    error: diagnosisError,
  } = useDiagnosisStatus(isAuthenticated);
  const {
    data: profileStats,
    isLoading: statsLoading,
    isError: statsFailed,
    error: statsError,
  } = useProfileStats(isAuthenticated);

  const handlers = useMainPageHandlers({ diagnosisStatus, isAuthenticated });
  useDiagnosisToast();

  const diagnosisHasNonAuthError = diagnosisFailed && !isAuthError(diagnosisError);
  const statsHasNonAuthError = statsFailed && !isAuthError(statsError);
  const hasError = diagnosisHasNonAuthError || statsHasNonAuthError;
  const isLoading = isAuthenticated && (diagnosisLoading || statsLoading);
  const diagnosisCompleted =
    isAuthenticated && !diagnosisLoading ? (diagnosisStatus?.hasCompleted ?? false) : false;

  const stats = profileStats || DEFAULT_STATS;

  return (
    <div className="min-h-screen bg-cream-canvas">
      <HomeHero
        diagnosisCompleted={diagnosisCompleted}
        level={stats.level}
        streak={stats.streak}
        onStartSession={handlers.handleQuizClick}
        onReviewOnly={handlers.handleFlashcardClick}
        onDiagnosis={handlers.handleDiagnosisClick}
      />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-4 md:px-10">
        {hasError && (
          <div className="tactile-card mt-6 p-6 text-center">
            <p className="font-semibold text-ink">
              데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}

        {!hasError && (
          <>
            <ReportSection label="이번 주" divider={false}>
              <MetricsStrip
                totalXP={stats.totalXP}
                streak={stats.streak}
                totalWordLearned={stats.totalWordLearned}
                level={stats.level}
                diagnosisCompleted={diagnosisCompleted}
                isLoading={isLoading}
              />
            </ReportSection>

            {diagnosisCompleted && !isLoading && (
              <ReportSection label="진단 리포트">
                <WeaknessAreas
                  weaknessAreas={normalizeWeaknessAreas(profileStats?.weaknessAreas)}
                />
              </ReportSection>
            )}

            <ReportSection label="학습 활동">
              <ActivityList
                diagnosisStatus={diagnosisStatus}
                diagnosisCompleted={diagnosisCompleted}
                hasCompletedTodayQuiz={profileStats?.hasCompletedTodayQuiz ?? false}
                handlers={handlers}
              />
            </ReportSection>
          </>
        )}
      </div>
    </div>
  );
}
