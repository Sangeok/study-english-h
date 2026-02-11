"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Confetti } from "@/shared/ui";
import { apiClient, queryKeys } from "@/shared/lib";
import { DiagnosisLoading } from "../status/diagnosis-loading";
import { DiagnosisError } from "../status/diagnosis-error";
import { CEFRLevelBadge } from "./cefr-level-badge";
import { WeaknessAreasList } from "./weakness-areas-list";
import { ResultActions } from "./result-actions";

interface DiagnosisResultData {
  totalScore: number;
  cefrLevel: string;
  weaknessAreas: { category: string; accuracy: number }[];
  completedAt: string;
}

interface DiagnosisResultProps {
  diagnosisId: string;
}

async function fetchDiagnosisResult(
  diagnosisId: string
): Promise<DiagnosisResultData> {
  return apiClient.get<DiagnosisResultData>(`/api/diagnosis/${diagnosisId}`);
}

export function DiagnosisResult({ diagnosisId }: DiagnosisResultProps) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.diagnosis.detail(diagnosisId),
    queryFn: () => fetchDiagnosisResult(diagnosisId),
    enabled: Boolean(diagnosisId),
  });

  if (isLoading) {
    return (
      <DiagnosisLoading
        title="결과 분석 중..."
        description="진단 결과를 분석하고 있어요"
      />
    );
  }

  if (isError || !data) {
    return (
      <DiagnosisError
        title="결과를 불러올 수 없어요"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 py-12 px-4">
      <Confetti
        count={50}
        colors={["#a855f7", "#8b5cf6", "#6366f1", "#ec4899"]}
        delay={300}
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100">
          <CEFRLevelBadge
            cefrLevel={data.cefrLevel}
            totalScore={data.totalScore}
          />

          <WeaknessAreasList weaknessAreas={data.weaknessAreas} />

          <ResultActions
            onStartStudy={() => router.push("/dashboard")}
            onGoHome={() => router.push("/main")}
          />
        </div>
      </div>
    </div>
  );
}
