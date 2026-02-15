"use client";

import { useDiagnosisStatus } from "@/features/diagnosis";
import { ApiError, useProfileStats } from "@/shared/lib";
import { useMainPageHandlers } from "../hooks/use-main-page-handlers";
import { useDiagnosisToast } from "../hooks/use-diagnosis-toast";
import { HeroSection } from "./hero-section";
import { QuickAccessSection } from "./quick-access-section";
import { ProgressSection } from "./progress-section";
import { ActivitySection } from "./activity-section";
import { FooterCTA } from "./footer-cta";

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
  const diagnosisCompleted = isAuthenticated && !diagnosisLoading ? (diagnosisStatus?.hasCompleted ?? false) : false;

  const stats = profileStats || DEFAULT_STATS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden">
      <HeroSection
        diagnosisCompleted={diagnosisCompleted}
        onDiagnosisClick={handlers.handleDiagnosisClick}
        onQuizClick={handlers.handleQuizClick}
      />

      {hasError && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-800 font-medium">
              데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        </div>
      )}

      {!hasError && (
        <>
          <QuickAccessSection
            diagnosisStatus={diagnosisStatus}
            diagnosisCompleted={diagnosisCompleted}
            handlers={handlers}
          />

          <ProgressSection
            totalXP={stats.totalXP}
            streak={stats.streak}
            level={stats.level}
            weaknessAreas={profileStats?.weaknessAreas}
            isLoading={isLoading}
            diagnosisCompleted={diagnosisCompleted}
            onViewAllStats={() => handlers.handleComingSoon("상세 통계")}
          />

          <ActivitySection
            diagnosisCompleted={diagnosisCompleted}
            isLoading={isLoading}
            onQuizClick={handlers.handleQuizClick}
            onChallengeClick={() => handlers.handleComingSoon("데일리 챌린지")}
          />

          <FooterCTA
            diagnosisCompleted={diagnosisCompleted}
            onQuizClick={handlers.handleQuizClick}
            onFlashcardClick={handlers.handleFlashcardClick}
          />
        </>
      )}
    </div>
  );
}
