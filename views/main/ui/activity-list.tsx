"use client";

import type { DiagnosisStatusResponse } from "@/features/diagnosis";
import { FEATURE_CARDS, type MainPageHandlers } from "../constants";

interface ActivityListProps {
  diagnosisStatus: DiagnosisStatusResponse | undefined;
  diagnosisCompleted: boolean;
  hasCompletedTodayQuiz: boolean;
  handlers: MainPageHandlers;
}

/** 학습 활동 — 아이콘 카드 대신 타이포그래피 행 목록 */
export function ActivityList({
  diagnosisStatus,
  diagnosisCompleted,
  hasCompletedTodayQuiz,
  handlers,
}: ActivityListProps) {
  const context = { diagnosisStatus, diagnosisCompleted, hasCompletedTodayQuiz };

  return (
    <div>
      {FEATURE_CARDS.map((card, i) => {
        const status = card.getStatus(context);
        const isSoon = status === "coming-soon";
        const isLocked = status === "locked";
        const onClick =
          card.handlerKey === "handleComingSoon"
            ? () => handlers.handleComingSoon(card.featureName)
            : handlers[card.handlerKey];

        return (
          <div
            key={card.id}
            className={[
              "flex flex-wrap items-baseline gap-x-5 gap-y-1.5 py-4",
              i > 0 ? "border-t border-border-warm" : "",
            ].join(" ")}
          >
            <b
              className={[
                "whitespace-nowrap text-base font-bold tracking-tight",
                isSoon || isLocked ? "text-ink-soft" : "text-ink",
              ].join(" ")}
            >
              {card.title}
            </b>
            <span className="text-[13.5px] text-ink-soft">{card.getDescription(context)}</span>
            <button
              onClick={isLocked ? undefined : onClick}
              disabled={isLocked}
              className={[
                "ml-auto whitespace-nowrap text-sm font-bold",
                isSoon || isLocked
                  ? "cursor-default text-ink-soft"
                  : "text-teal underline-offset-4 hover:underline",
              ].join(" ")}
            >
              {card.getActionLabel(context)}
            </button>
          </div>
        );
      })}
    </div>
  );
}
