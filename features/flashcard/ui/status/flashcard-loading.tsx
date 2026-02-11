import { FullPageSpinner } from "@/shared/ui";

interface FlashcardLoadingProps {
  message?: string;
}

export function FlashcardLoading({ message = "플래시카드를 준비하는 중..." }: FlashcardLoadingProps) {
  return <FullPageSpinner message={message} />;
}
