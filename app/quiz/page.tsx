import { QuizContainer } from "@/features/quiz";
import { requireDiagnosis } from "@/shared/lib/diagnosis-guards";

export default async function QuizPage() {
  // 진단 완료 여부 확인 (미완료 시 자동 리다이렉트)
  await requireDiagnosis();

  return <QuizContainer />;
}
