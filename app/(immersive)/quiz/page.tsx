import { Suspense } from "react";
import { QuizEntryGate, QuizErrorBoundary, QuizLoading } from "@/features/quiz";
import { requireDiagnosis } from "@/shared/lib/diagnosis-guards";

export default async function QuizPage() {
  await requireDiagnosis();

  return (
    <Suspense fallback={<QuizLoading />}>
      <QuizErrorBoundary>
        <QuizEntryGate />
      </QuizErrorBoundary>
    </Suspense>
  );
}
