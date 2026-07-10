"use client";

import { useState } from "react";
import { signIn } from "@/shared/lib/client";
import type { DiagnosisResult } from "../../types";
import { CEFRLevelBadge } from "./cefr-level-badge";
import { WeaknessAreasList } from "./weakness-areas-list";

interface GuestDiagnosisResultProps {
  result: DiagnosisResult;
}

export function GuestDiagnosisResult({ result }: GuestDiagnosisResultProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoSignup = async () => {
    setIsLoading(true);
    try {
      // 같은 탭 리다이렉트 — sessionStorage가 유지되어 가입 후 이관 훅이 답변을 재전송한다.
      // callbackURL을 홈(/)으로 고정 → 복귀 지점에서 이관 훅(MainPage 마운트)이 반드시 실행된다.
      await signIn.social({ provider: "kakao", callbackURL: "/" });
    } catch (error) {
      console.error("Error signing up with Kakao:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-canvas px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="tactile-card tactile-card--raised p-6 md:p-10">
          <CEFRLevelBadge cefrLevel={result.cefrLevel} totalScore={result.totalScore} />

          <WeaknessAreasList weaknessAreas={result.weaknessAreas} />

          {/* 가입 유도 CTA — 결과는 아직 서버에 없고, 가입해야 저장된다. */}
          <div className="mt-8 rounded-2xl border border-cobalt/20 bg-cobalt/[0.04] p-6 text-center">
            <h3 className="font-display text-xl font-bold text-ink md:text-2xl">
              결과를 저장하고 학습을 시작하세요
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              카카오로 가입하면 이 결과가 계정에 저장되고, 딱 맞는 레벨에서 학습이 시작돼요.
            </p>
            <button
              onClick={handleKakaoSignup}
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FEE500] px-6 py-4 font-bold text-[#191919] transition-colors hover:bg-[#f6dc00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <>
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.545 1.574 4.778 4.01 6.164l-1.013 3.644c-.067.242.17.451.394.35l4.237-1.906C10.438 18.917 11.204 19 12 19c5.514 0 10-3.262 10-7.5S17.514 3 12 3z" />
                  </svg>
                  <span>카카오로 가입하고 결과 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
