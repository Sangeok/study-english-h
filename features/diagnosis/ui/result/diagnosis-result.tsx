"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { Confetti } from "@/shared/ui";
import { ROUTES } from "@/shared/constants";
import { fetchDiagnosisResult } from "../../api/diagnosis-api";
import { DiagnosisError } from "../status/diagnosis-error";
import { DiagnosisLoading } from "../status/diagnosis-loading";
import { CEFRLevelBadge } from "./cefr-level-badge";
import { ResultActions } from "./result-actions";
import { WeaknessAreasList } from "./weakness-areas-list";

interface DiagnosisResultProps {
  diagnosisId: string;
}

export function DiagnosisResult({ diagnosisId }: DiagnosisResultProps) {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.diagnosis.detail(diagnosisId),
    queryFn: () => fetchDiagnosisResult(diagnosisId),
    enabled: Boolean(diagnosisId),
  });

  if (isLoading) {
    return (
      <DiagnosisLoading
        title="진단 결과를 분석 중입니다..."
        description="상세 결과를 준비하고 있어요."
      />
    );
  }

  if (isError || !data) {
    return (
      <DiagnosisError
        title="진단 결과를 불러오지 못했습니다."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream-canvas px-4 py-12">
      <Confetti
        count={50}
        colors={["#2E6BFF", "#6E9BFF", "#E8A23D", "#F9701A"]}
        delay={300}
      />

      <div className="mx-auto max-w-2xl">
        <div className="tactile-card tactile-card--raised p-6 md:p-10">
          <CEFRLevelBadge cefrLevel={data.cefrLevel} totalScore={data.totalScore} />

          <WeaknessAreasList weaknessAreas={data.weaknessAreas} />

          <ResultActions
            onStartStudy={() => router.push("/dashboard")}
            onGoHome={() => router.push(ROUTES.HOME)}
          />
        </div>
      </div>
    </div>
  );
}
