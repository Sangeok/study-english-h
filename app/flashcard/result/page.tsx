import { Suspense } from "react";
import { SessionResultContent, FlashcardLoading } from "@/features/flashcard";

export default function ResultPage() {
  return (
    <Suspense fallback={<FlashcardLoading message="결과를 불러오는 중..." />}>
      <SessionResultContent />
    </Suspense>
  );
}
