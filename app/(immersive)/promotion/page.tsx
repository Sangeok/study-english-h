import { Suspense } from "react";
import { PromotionTest, PromotionErrorBoundary } from "@/features/promotion";
import { FullPageSpinner } from "@/shared/ui";
import { requireDiagnosis } from "@/shared/lib/diagnosis-guards";

/**
 * 승급 시험 페이지 — quiz/page.tsx 패턴.
 * QuizLoading·QuizErrorBoundary 는 features/quiz 소유라 임포트하지 않는다:
 * fallback 은 shared/ui 의 FullPageSpinner, 경계는 슬라이스 소유 PromotionErrorBoundary 다.
 */
export default async function PromotionPage() {
  await requireDiagnosis();

  return (
    <Suspense fallback={<FullPageSpinner message="시험을 준비하고 있어요..." />}>
      <PromotionErrorBoundary>
        <PromotionTest />
      </PromotionErrorBoundary>
    </Suspense>
  );
}
