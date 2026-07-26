import Link from "next/link";
import { FLASHCARD_ROUTES } from "../../config";
import type { SessionMode } from "../../types";

interface EmptyStateContent {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

/**
 * 빈 복습 큐는 실패가 아니라 정상 상태다 — "밀린 게 없다"는 좋은 소식으로 말한다.
 * 여기서 신규 학습으로 유도하지 않는다: 새 단어를 만나는 곳은 데일리 퀴즈뿐이다(ADR 0002).
 * 이 폴백이 복습 세션에서 신규 학습으로 새는 유일한 경로였다.
 */
function getEmptyStateContent(mode: SessionMode): EmptyStateContent {
  if (mode === "review") {
    return {
      title: "밀린 복습이 없어요",
      description: "오늘 퀴즈를 풀면 만난 단어가 복습 목록에 쌓여요.",
      actionLabel: "오늘 퀴즈 풀기",
      href: FLASHCARD_ROUTES.quiz,
    };
  }

  return {
    title: "학습할 카드가 없어요",
    description: "홈에서 오늘의 학습을 이어가세요.",
    actionLabel: "홈으로",
    href: FLASHCARD_ROUTES.home,
  };
}

interface FlashcardEmptyProps {
  mode: SessionMode;
}

export function FlashcardEmpty({ mode }: FlashcardEmptyProps) {
  const content = getEmptyStateContent(mode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-chamber px-4">
      <div className="w-full max-w-md rounded-2xl border border-chamber-line bg-chamber-panel p-8 text-center animate-[pop-in]">
        <h2 className="font-display text-2xl font-bold text-chamber-ink">{content.title}</h2>
        <p className="mt-2 text-chamber-soft">{content.description}</p>
        <Link
          href={content.href}
          className="tactile-btn tactile-btn--teal tactile-btn--block tactile-btn--lg mt-6"
        >
          {content.actionLabel}
        </Link>
      </div>
    </div>
  );
}
