"use client";

import { useDiagnosisStatus } from "@/features/diagnosis";
import { useProfileStats } from "@/shared/lib";
import { useMainPageHandlers } from "../hooks/use-main-page-handlers";
import { useDiagnosisToast } from "../hooks/use-diagnosis-toast";
import { Navigation } from "./navigation";
import { HeroSection } from "./hero-section";
import { QuickAccessSection } from "./quick-access-section";
import { ProgressSection } from "./progress-section";
import { ActivitySection } from "./activity-section";
import { FooterCTA } from "./footer-cta";

export default function MainPage() {
  const { data: diagnosisStatus, isLoading: diagnosisLoading, isError: diagnosisError } = useDiagnosisStatus();
  const { data: profileStats, isLoading: statsLoading, isError: statsError } = useProfileStats();

  // 비즈니스 로직을 커스텀 훅으로 분리
  const handlers = useMainPageHandlers({ diagnosisStatus });
  useDiagnosisToast(); // Toast 로직 자동 실행

  const isLoading = diagnosisLoading || statsLoading;
  const hasError = diagnosisError || statsError;
  const diagnosisCompleted = diagnosisLoading ? null : (diagnosisStatus?.hasCompleted ?? false);

  // 실제 데이터 또는 기본값
  const stats = profileStats || {
    totalXP: 0,
    streak: 0,
    totalWordLearned: 0,
    vocabularyProgress: 0,
    level: "A1",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden">
      <Navigation
        streak={stats.streak}
        isLoading={isLoading}
      />

      <HeroSection
        diagnosisCompleted={diagnosisCompleted ?? false}
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
            diagnosisCompleted={diagnosisCompleted ?? false}
            handlers={handlers}
          />

          <ProgressSection
            totalXP={stats.totalXP}
            streak={stats.streak}
            level={stats.level}
            weaknessAreas={profileStats?.weaknessAreas}
            isLoading={isLoading}
            diagnosisCompleted={diagnosisCompleted ?? false}
            onViewAllStats={() => handlers.handleComingSoon("상세 통계")}
          />

          <ActivitySection
            diagnosisCompleted={diagnosisCompleted ?? false}
            isLoading={isLoading}
            onQuizClick={handlers.handleQuizClick}
            onChallengeClick={() => handlers.handleComingSoon("데일리 챌린지")}
          />

          <FooterCTA
            diagnosisCompleted={diagnosisCompleted ?? false}
            onQuizClick={handlers.handleQuizClick}
            onFlashcardClick={handlers.handleFlashcardClick}
          />
        </>
      )}
    </div>
  );
}
