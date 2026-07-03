import { DiagnosisResult } from "@/features/diagnosis";

interface DiagnosisResultPageProps {
  searchParams: Promise<{ id?: string | string[] }>;
}

export default async function DiagnosisResultPage({ searchParams }: DiagnosisResultPageProps) {
  const params = await searchParams;
  const diagnosisId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!diagnosisId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-canvas px-4">
        <p className="font-medium text-ink-soft">진단 결과를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <DiagnosisResult diagnosisId={diagnosisId} />;
}
