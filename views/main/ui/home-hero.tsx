"use client";

import { Flame } from "lucide-react";
import { CefrRuler } from "./cefr-ruler";

const NEXT_LEVEL: Record<string, string> = {
  A1: "A2",
  A2: "B1",
  B1: "B2",
  B2: "C1",
  C1: "C2",
  C2: "C2",
};

interface HomeHeroProps {
  diagnosisCompleted: boolean;
  level: string;
  streak: number;
  onStartSession: () => void;
  onReviewOnly: () => void;
  onDiagnosis: () => void;
}

/** 훈련장 입구 — 퀴즈 챔버와 같은 네이비 재질의 홈 히어로 */
export function HomeHero({
  diagnosisCompleted,
  level,
  streak,
  onStartSession,
  onReviewOnly,
  onDiagnosis,
}: HomeHeroProps) {
  const next = NEXT_LEVEL[level] ?? "B1";

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
                다음 목표는 {next}예요.
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
                  복습만 하기
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
            <CefrRuler level={diagnosisCompleted ? level : null} />
          </div>
        </div>
      </div>
    </section>
  );
}
