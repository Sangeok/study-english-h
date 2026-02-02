import { DiagnosisTest } from "@/features/diagnosis";
import { preventDiagnosisRetake } from "@/shared/lib";

export default async function DiagnosisPage() {
  // 진단 재실행 방지 (이미 완료 시 자동 리다이렉트)
  await preventDiagnosisRetake();

  return <DiagnosisTest />;
}
