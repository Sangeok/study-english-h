"use client";

import { useState } from "react";
import { signIn } from "@/shared/lib/client";

const FEATURES = ["CEFR 레벨 진단", "어휘 퀴즈", "간격 반복 복습", "리그 · 스트릭"];

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-chamber text-chamber-ink">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — brand & messaging */}
          <div className="animate-slide-in-left flex flex-col justify-center space-y-8">
            <p className="font-display text-2xl font-extrabold tracking-tight">
              Study<span className="text-cobalt-lt">English</span>
            </p>

            <div className="space-y-4">
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                감이 아니라,
                <br />
                <span className="text-cobalt-lt">측정으로 배우는 영어</span>
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-chamber-soft">
                15분 레벨 진단에서 시작해, 매일의 퀴즈와 복습이 실력을 만들어요.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {FEATURES.map((label, index) => (
                <span
                  key={label}
                  className="animate-[pop-in] rounded-full border border-chamber-line px-3.5 py-1.5 text-[13px] font-bold text-chamber-soft"
                  style={{ animationDelay: `${0.15 + index * 0.08}s` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — login card */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="animate-slide-in-right w-full max-w-md">
              <div className="rounded-2xl border border-chamber-line bg-chamber-panel p-8">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-cobalt-lt">
                  Welcome
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  오늘 세션을 시작해요
                </h2>
                <p className="mt-1.5 text-sm text-chamber-soft">
                  카카오 계정 하나면 바로 시작할 수 있어요.
                </p>

                <button
                  onClick={handleKakaoLogin}
                  disabled={isLoading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FEE500] px-6 py-4 font-bold text-[#191919] transition-colors hover:bg-[#f6dc00] disabled:cursor-not-allowed disabled:opacity-60"
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

                <p className="mt-6 text-center text-[13px] leading-relaxed text-chamber-soft">
                  계속 진행하면{" "}
                  <a href="#" className="font-bold text-chamber-ink underline underline-offset-2">
                    이용약관
                  </a>
                  과{" "}
                  <a href="#" className="font-bold text-chamber-ink underline underline-offset-2">
                    개인정보 처리방침
                  </a>
                  에 동의하게 돼요.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-chamber-soft">
                처음이신가요?{" "}
                <span className="font-bold text-cobalt-lt">
                  가입 절차 없이 카카오로 바로 시작돼요
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
