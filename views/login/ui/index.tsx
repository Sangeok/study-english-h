"use client";

import { useState } from "react";
import { signIn } from "@/shared/lib/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "kakao",
      });
    } catch (error) {
      console.error("Error logging in with Kakao:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating decorative shapes for an inviting, tactile atmosphere
  const floatShapes = [
    { emoji: "📚", x: "8%", y: "16%", delay: "0s", duration: "22s", size: "2.4rem" },
    { emoji: "✏️", x: "82%", y: "20%", delay: "2s", duration: "26s", size: "2rem" },
    { emoji: "🎯", x: "16%", y: "72%", delay: "4s", duration: "24s", size: "2.6rem" },
    { emoji: "⭐", x: "78%", y: "66%", delay: "1s", duration: "28s", size: "2.2rem" },
    { emoji: "🔥", x: "88%", y: "44%", delay: "3s", duration: "23s", size: "1.8rem" },
    { emoji: "💬", x: "6%", y: "46%", delay: "5s", duration: "27s", size: "2rem" },
  ];

  // Playful feature chips
  const features = [
    { emoji: "🧠", label: "AI 레벨 진단" },
    { emoji: "🗣️", label: "발음 분석" },
    { emoji: "🔁", label: "복습 시스템" },
    { emoji: "🏆", label: "리그 · 배지" },
  ];

  return (
    <div className="bg-cream-canvas relative min-h-screen overflow-hidden">
      {/* Soft corner glows */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-coral/20 blur-3xl"
        aria-hidden
      />

      {/* Floating decorative emoji */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {floatShapes.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float select-none opacity-70"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: item.delay,
              animationDuration: item.duration,
              fontSize: item.size,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — brand & messaging */}
          <div className="animate-slide-in-left flex flex-col justify-center space-y-7">
            {/* Brand mark */}
            <div className="flex items-center gap-3">
              <div className="tactile-tile h-14 w-14 border-teal-edge bg-teal text-3xl">
                <span>🦉</span>
              </div>
              <div>
                <p className="font-display text-xl font-bold leading-none text-ink">
                  Study English
                </p>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  매일 한 걸음, 영어 실력
                </p>
              </div>
            </div>

            {/* Hero headline */}
            <div className="space-y-4">
              <span className="tactile-chip border-coral-edge bg-coral-tint text-coral-edge">
                🎉 한국어로 시작하는 영어 학습
              </span>
              <h1 className="font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
                오늘부터
                <br />
                <span className="text-teal">영어가 쉬워져요</span>
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-ink-soft">
                AI 레벨 진단과 매일의 퀴즈로 나에게 꼭 맞는 영어 학습을 시작하세요.
                꾸준함이 실력이 됩니다.
              </p>
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => (
                <div
                  key={feature.label}
                  className="tactile-chip animate-[pop-in] border-border-warm bg-paper text-ink"
                  style={{ animationDelay: `${0.15 + index * 0.08}s` }}
                >
                  <span className="text-base">{feature.emoji}</span>
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — login card */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="animate-slide-in-right w-full max-w-md">
              <div className="tactile-card tactile-card--raised overflow-hidden">
                {/* Card header — teal filled with decorative depth */}
                <div className="relative overflow-hidden bg-teal px-8 py-10 text-white">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                  <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/10" />
                  <div
                    className="absolute right-8 top-8 h-3 w-3 rounded-full bg-gold"
                    aria-hidden
                  />
                  <div className="relative">
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      Welcome
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-bold">
                      다시 오셨군요 👋
                    </h2>
                    <p className="mt-2 text-white/85">학습 여정을 이어가 볼까요</p>
                  </div>
                </div>

                {/* Card body */}
                <div className="space-y-6 px-8 py-9">
                  {/* Kakao login — tactile brand button */}
                  <button
                    onClick={handleKakaoLogin}
                    disabled={isLoading}
                    className="tactile-btn tactile-btn--lg tactile-btn--block"
                    style={{
                      background: "#FEE500",
                      color: "#191919",
                      borderColor: "#d4c400",
                      boxShadow: "0 4px 0 0 #d4c400",
                    }}
                  >
                    {isLoading ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    ) : (
                      <>
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.545 1.574 4.778 4.01 6.164l-1.013 3.644c-.067.242.17.451.394.35l4.237-1.906C10.438 18.917 11.204 19 12 19c5.514 0 10-3.262 10-7.5S17.514 3 12 3z" />
                        </svg>
                        <span>카카오로 시작하기</span>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-border-warm" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-paper px-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                        안전한 로그인
                      </span>
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="rounded-[14px] border-2 border-ocean-edge bg-ocean-tint px-4 py-3">
                    <p className="text-center text-sm text-ocean-edge">
                      계속 진행하면{" "}
                      <a href="#" className="font-bold underline underline-offset-2">
                        이용약관
                      </a>
                      과{" "}
                      <a href="#" className="font-bold underline underline-offset-2">
                        개인정보 처리방침
                      </a>
                      에 동의하게 됩니다.
                    </p>
                  </div>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-6 pt-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-teal-edge">
                      <span className="text-base">🔒</span>
                      <span>안전</span>
                    </div>
                    <div className="h-4 w-0.5 rounded bg-border-warm" />
                    <div className="flex items-center gap-2 text-sm font-bold text-teal-edge">
                      <span className="text-base">🛡️</span>
                      <span>개인정보 보호</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom note */}
              <p className="mt-6 text-center text-sm text-ink-soft">
                처음이신가요?{" "}
                <span className="font-bold text-coral">
                  카카오 계정으로 바로 시작할 수 있어요
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
