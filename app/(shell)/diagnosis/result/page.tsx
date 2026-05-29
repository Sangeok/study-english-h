"use client";

import { Suspense } from "react";
import { DiagnosisResult } from "@/features/diagnosis";
import { useSearchParams } from "next/navigation";

function DiagnosisResultContent() {
  const searchParams = useSearchParams();
  const diagnosisId = searchParams?.get("id");

  if (!diagnosisId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
        <p className="font-medium text-ink-soft">진단 결과를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <DiagnosisResult diagnosisId={diagnosisId} />;
}

export default function DiagnosisResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
          <p className="font-medium text-ink-soft">로딩 중...</p>
        </div>
      }
    >
      <DiagnosisResultContent />
    </Suspense>
  );
}
