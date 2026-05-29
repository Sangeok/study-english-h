"use client";

import { cn } from "@/lib/utils";
import { GradientButton, FloatingCard } from "@/shared/ui";

interface HeroSectionProps {
  diagnosisCompleted: boolean;
  onDiagnosisClick: () => void;
  onQuizClick: () => void;
}

function heroAnimClass(delay?: string): string {
  if (delay) return `animate-hero-fade-up [animation-delay:${delay}]`;
  return "animate-hero-fade-up";
}

export function HeroSection({ diagnosisCompleted, onDiagnosisClick, onQuizClick }: HeroSectionProps) {
  return (
    <section
      className="relative z-10 overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:px-20"
      aria-label="영어 학습 소개"
    >
      {/* Atmosphere — soft corner glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-coral/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Left — copy */}
        <div>
          <div
            className={cn("tactile-chip mb-8 border-teal bg-teal-tint text-ink", heroAnimClass())}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            <span className="text-sm font-bold text-teal-edge">AI 기반 맞춤형 영어 학습</span>
          </div>

          <h2
            className={cn(
              "mb-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl",
              heroAnimClass("0.1s")
            )}
          >
            영어를 배우는
            <br />
            <span className="relative inline-block text-teal">
              더 스마트한 방법
              <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-gold/40" />
            </span>
          </h2>

          <p
            className={cn(
              "mb-10 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl",
              heroAnimClass("0.2s")
            )}
          >
            AI가 분석하는 나만의 CEFR 레벨 진단, 스마트 어휘 퀴즈, 그리고 간격 반복 시스템으로 영어 실력을 빠르게
            성장시키세요.
          </p>

          <div className={cn("flex flex-wrap gap-4", heroAnimClass("0.3s"))}>
            {!diagnosisCompleted && (
              <GradientButton onClick={onDiagnosisClick}>
                <span className="flex items-center gap-2">
                  <span>🎯</span>레벨 진단 시작하기
                </span>
              </GradientButton>
            )}
            {diagnosisCompleted && (
              <GradientButton onClick={onQuizClick}>
                <span className="flex items-center gap-2">
                  <span>🚀</span>학습 시작하기
                </span>
              </GradientButton>
            )}

            <button onClick={onDiagnosisClick} className="tactile-btn tactile-btn--ghost tactile-btn--lg">
              <span className="flex items-center gap-2">
                <span>📊</span>내 레벨 진단하기
              </span>
            </button>
          </div>
        </div>

        {/* Right — playful floating card cluster (desktop) */}
        <div
          className={cn(
            "relative hidden h-[420px] lg:block",
            heroAnimClass("0.25s")
          )}
          aria-hidden
        >
          <FloatingCard
            gradient="purple"
            icon="🔥"
            title="7일 연속"
            subtitle="스트릭 유지 중"
            rotation={-5}
            className="left-4 top-4 w-60 animate-bounce-gentle"
          />
          <FloatingCard
            gradient="indigo"
            icon="⭐"
            title="1,240 XP"
            subtitle="이번 주 +320"
            rotation={4}
            className="right-2 top-28 w-56"
          />
          <FloatingCard
            gradient="violet"
            icon="🏆"
            title="Level B1"
            subtitle="중급 어휘 마스터 중"
            rotation={-3}
            className="bottom-6 left-10 w-64"
          />
          <div
            className="absolute right-10 bottom-2 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gold-edge bg-gold text-3xl"
            style={{ boxShadow: "0 5px 0 0 var(--gold-edge)" }}
          >
            🎯
          </div>
        </div>
      </div>
    </section>
  );
}
