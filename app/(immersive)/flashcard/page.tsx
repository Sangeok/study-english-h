import { Suspense } from "react";
import { FlashcardContainer, FlashcardLoading } from "@/features/flashcard";

export default function FlashcardPage() {
  return (
    <Suspense fallback={<FlashcardLoading message="로딩 중..." />}>
      <FlashcardContainer />
    </Suspense>
  );
}
