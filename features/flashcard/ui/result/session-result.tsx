"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { countBy } from "@/shared/lib/array-utils";
import { FLASHCARD_RESULT_MESSAGES, FLASHCARD_ROUTES, FLASHCARD_STORAGE_KEYS } from "../../config";
import type { MasteryLevel, SessionResult } from "../../types";
import { MasteryBreakdown } from "./mastery-breakdown";
import { StatsGrid } from "./stats-grid";

function getResultHeader(accuracy: number) {
  return (
    FLASHCARD_RESULT_MESSAGES.find((entry) => accuracy >= entry.minAccuracy) ??
    FLASHCARD_RESULT_MESSAGES[FLASHCARD_RESULT_MESSAGES.length - 1]
  );
}

export function SessionResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionResult] = useState<SessionResult>(() => {
    if (typeof window !== "undefined") {
      const storedResult = sessionStorage.getItem(FLASHCARD_STORAGE_KEYS.result);
      if (storedResult) {
        try {
          const parsed = JSON.parse(storedResult) as SessionResult;
          sessionStorage.removeItem(FLASHCARD_STORAGE_KEYS.result);
          return parsed;
        } catch (error) {
          console.error("Failed to parse flashcard result:", error);
        }
      }
    }

    return {
      xp: Number(searchParams.get("xp") || 0),
      accuracy: Number(searchParams.get("accuracy") || 0),
      total: Number(searchParams.get("total") || 0),
      correct: Number(searchParams.get("correct") || 0),
    };
  });

  const { xp, accuracy, total, correct, results } = sessionResult;
  const resultHeader = getResultHeader(accuracy);

  const masteryBreakdown = (
    results ? countBy(results, (result) => result.masteryLevel) : {}
  ) as Partial<Record<MasteryLevel, number>>;

  const nextReviewDate =
    results && results.length > 0
      ? new Date(Math.min(...results.map((result) => new Date(result.nextReviewDate).getTime())))
      : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-canvas px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-teal-tint blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-40 h-64 w-64 rounded-full bg-gold-tint blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-4xl space-y-6">
        {/* Celebratory hero — accuracy as giant display % */}
        <div
          className="relative overflow-hidden rounded-[28px] border-2 border-teal-edge bg-teal p-8 text-white animate-[pop-in]"
          style={{
            boxShadow:
              "0 6px 0 0 var(--teal-edge), 0 28px 44px -26px rgba(18,184,134,0.55)",
          }}
        >
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" aria-hidden />
          <div className="absolute right-24 -bottom-10 h-32 w-32 rounded-full bg-white/10" aria-hidden />
          <span
            className="pointer-events-none absolute -bottom-6 left-4 select-none text-8xl opacity-20"
            aria-hidden
          >
            {resultHeader.emoji}
          </span>

          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
                세션 완료 {resultHeader.emoji}
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                {resultHeader.title}
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/85">{resultHeader.motivation}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
                정답률
              </p>
              <p className="font-display text-6xl font-bold leading-none md:text-7xl">
                {accuracy.toFixed(0)}
                <span className="text-3xl">%</span>
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="tactile-progress border-white/30 bg-white/20">
              <div
                className="tactile-progress__fill"
                style={{ width: `${accuracy}%`, background: "var(--gold)" }}
              />
            </div>
          </div>
        </div>

        <StatsGrid accuracy={accuracy} xp={xp} correct={correct} total={total} />

        {Object.keys(masteryBreakdown).length > 0 && (
          <MasteryBreakdown breakdown={masteryBreakdown} />
        )}

        {nextReviewDate && (
          <div
            className="relative overflow-hidden rounded-[24px] border-2 border-ocean-edge bg-ocean p-6 text-white md:p-8"
            style={{ boxShadow: "0 5px 0 0 var(--ocean-edge)" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
            <div className="relative flex items-center gap-4">
              <div className="tactile-tile h-16 w-16 shrink-0 border-white/30 bg-white/20 font-display text-lg font-bold text-white">
                <span>SRS</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold">다음 복습 시간</h3>
                <p className="mt-1 text-lg text-white/90">
                  {nextReviewDate.toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  간격 반복 알고리즘이 자동으로 정해주는 일정이에요.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="tactile-card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="tactile-tile h-11 w-11 border-teal bg-teal-tint text-xl">
              <span>🚀</span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink">다음 학습</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`${FLASHCARD_ROUTES.session}?mode=review`)}
              className="tactile-btn tactile-btn--teal tactile-btn--block tactile-btn--lg"
            >
              복습 이어하기
            </button>
            <button
              onClick={() => router.push(`${FLASHCARD_ROUTES.session}?mode=new`)}
              className="tactile-btn tactile-btn--ocean tactile-btn--block tactile-btn--lg"
            >
              새 단어 배우기
            </button>
            <button
              onClick={() => router.push(FLASHCARD_ROUTES.modes)}
              className="tactile-btn tactile-btn--ghost tactile-btn--block"
            >
              학습 모드 변경
            </button>
            <button
              onClick={() => router.push(FLASHCARD_ROUTES.home)}
              className="tactile-btn tactile-btn--ghost tactile-btn--block"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>

        <div className="tactile-card p-6 md:p-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="tactile-tile h-11 w-11 border-gold bg-gold-tint text-xl">
              <span>💡</span>
            </div>
            <h3 className="font-display text-lg font-bold text-ink">학습 팁</h3>
          </div>
          <div className="space-y-2 text-sm text-ink-soft">
            <p>세션은 짧고 자주 반복할수록 장기 기억에 좋아요.</p>
            <p>어려웠거나 잊은 카드를 다음 학습에서 먼저 복습하세요.</p>
            <p>복습 일정을 지키면 꾸준히 실력이 늘어요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
