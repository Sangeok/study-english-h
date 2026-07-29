"use client";

import { Flame } from "lucide-react";
import { getNextLevel } from "@/shared/constants";
import type { ProfileStats } from "@/entities/user/types";
import { LevelProgressPanel } from "./level-progress-panel";

interface HomeHeroProps {
  diagnosisCompleted: boolean;
  level: string;
  streak: number;
  /** 복습 도래 단어 수 — 0이면 개수를 감춘다. */
  reviewCount: number;
  /** 현재 레벨 준비도 0-100 */
  levelProgress: number;
  promotionStatus: ProfileStats["promotionStatus"];
  promotionAvailableAt: string | null;
  onStartSession: () => void;
  onReviewOnly: () => void;
  onDiagnosis: () => void;
  onStartPromotion: () => void;
}

/** 훈련장 입구 — 퀴즈 챔버와 같은 네이비 재질의 홈 히어로 */
export function HomeHero({
  diagnosisCompleted,
  level,
  streak,
  reviewCount,
  levelProgress,
  promotionStatus,
  promotionAvailableAt,
  onStartSession,
  onReviewOnly,
  onDiagnosis,
  onStartPromotion,
}: HomeHeroProps) {
  // canonical 헬퍼 — 로컬 NEXT_LEVEL 맵은 C2 를 자기 자신으로 매핑해
  // "다음 목표는 C2예요" 라는 어색한 문장을 만들었다.
  const next = getNextLevel(level);

  return (
    <section className="bg-chamber text-chamber-ink" aria-label="오늘의 학습">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-14 pt-12 md:px-10 lg:grid-cols-[6fr_5fr] lg:gap-14">
        <div>
          {streak > 0 && (
            <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-chamber-soft">
              <span className="inline-flex items-center gap-1.5 font-bold text-coral">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {streak}일 연속 학습
              </span>
            </div>
          )}

          {diagnosisCompleted ? (
            <>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                지금 <em className="not-italic text-cobalt-lt">{level}</em>,
                <br />
                {next ? `다음 목표는 ${next}예요.` : "최고 레벨을 유지하고 있어요."}
              </h1>
              <p className="mt-4 max-w-xl text-chamber-soft">
                오늘 세션은 퀴즈 10문제 · 약 7분이면 돼요.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={onStartSession}
                  className="tactile-btn tactile-btn--teal tactile-btn--lg"
                >
                  오늘 세션 시작
                </button>
                <button
                  onClick={onReviewOnly}
                  className="tactile-btn tactile-btn--lg border-chamber-line bg-transparent text-[#c7d3e8] hover:border-chamber-soft hover:text-white"
                >
                  {/* 개수를 붙여야 "복습할 게 있는지" 를 홈에서 알 수 있다 */}
                  <span>복습만 하기</span>
                  {reviewCount > 0 && (
                    <span className="ml-1 rounded-full bg-cobalt-lt px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                      {reviewCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                먼저 15분,
                <br />내 <em className="not-italic text-cobalt-lt">레벨</em>부터 측정해요.
              </h1>
              <p className="mt-4 max-w-xl text-chamber-soft">
                20문항 적응형 진단으로 CEFR 레벨을 알려드려요. 학습은 그 지점에서 시작돼요.
              </p>
              <div className="mt-8">
                <button
                  onClick={onDiagnosis}
                  className="tactile-btn tactile-btn--teal tactile-btn--lg"
                >
                  레벨 진단 시작
                </button>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex items-end gap-4">
            <span className="font-display text-7xl font-extrabold leading-[0.86] tracking-tighter text-white md:text-8xl">
              {diagnosisCompleted ? level : "?"}
            </span>
            <div className="pb-1 text-[13px] leading-relaxed text-chamber-soft">
              {diagnosisCompleted ? (
                <span>
                  현재 레벨
                  <br />
                  재진단으로 갱신할 수 있어요
                </span>
              ) : (
                <span>
                  아직 미진단
                  <br />
                  측정 후 이 눈금 위에 표시돼요
                </span>
              )}
            </div>
          </div>
          <div className="mt-7">
            <LevelProgressPanel
              diagnosisCompleted={diagnosisCompleted}
              level={level}
              levelProgress={levelProgress}
              promotionStatus={promotionStatus}
              promotionAvailableAt={promotionAvailableAt}
              onStartPromotion={onStartPromotion}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
