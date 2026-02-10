"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GradientButton } from "@/shared/ui";

interface HeroSectionProps {
  diagnosisCompleted: boolean;
  onDiagnosisClick: () => void;
  onQuizClick: () => void;
}

function heroAnimClass(mounted: boolean, delay?: string): string {
  if (!mounted) return "opacity-0";
  if (delay) return `animate-hero-fade-up [animation-delay:${delay}]`;
  return "animate-hero-fade-up";
}

export function HeroSection({ diagnosisCompleted, onDiagnosisClick, onQuizClick }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative z-10 px-6 py-16 md:py-24 md:px-12 lg:px-20 overflow-hidden" aria-label="영어 학습 소개">
      {/* Main content */}
      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-purple-200 shadow-sm mb-8", heroAnimClass(mounted))}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm font-medium text-purple-800">AI 기반 맞춤형 영어 학습</span>
          </div>

          {/* Headline */}
          <h2
            className={cn("text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6", heroAnimClass(mounted, "0.1s"))}
          >
            <span className="text-purple-950">영어를 배우는</span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              더 스마트한 방법
            </span>
          </h2>

          {/* Subheadline */}
          <p
            className={cn("text-lg md:text-xl text-purple-800/80 leading-relaxed mb-10 max-w-xl", heroAnimClass(mounted, "0.2s"))}
          >
            AI가 분석하는 나만의 CEFR 레벨 진단, 스마트 어휘 퀴즈, 그리고 간격 반복 시스템으로 영어 실력을 빠르게
            성장시키세요.
          </p>

          {/* CTA Buttons */}
          <div
            className={cn("flex flex-wrap gap-4 mb-14", heroAnimClass(mounted, "0.3s"))}
          >
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

            <button
              onClick={onDiagnosisClick}
              className="px-8 py-4 rounded-2xl font-semibold text-purple-700 bg-white/80 backdrop-blur-sm border border-purple-200 shadow-sm hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <span>📊</span>내 레벨 진단하기
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
