"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/shared/lib/client";
import type { DiagnosisResult } from "../../types";
import { CEFRLevelBadge } from "./cefr-level-badge";
import { WeaknessAreasList } from "./weakness-areas-list";

export type GuestDiagnosisCacheState =
  | { status: "saving" }
  | { status: "ready" }
  | { status: "error"; onRetryCacheSave: () => void };

interface GuestDiagnosisResultProps {
  result: DiagnosisResult;
  cacheState: GuestDiagnosisCacheState;
}

type OAuthState =
  | { status: "idle" }
  | { status: "redirecting" }
  | { status: "start-error" };

export function GuestDiagnosisResult({
  result,
  cacheState,
}: GuestDiagnosisResultProps) {
  const searchParams = useSearchParams();
  const [oauthState, setOauthState] = useState<OAuthState>({ status: "idle" });
  const oauthDidNotComplete = searchParams.get("oauth") === "cancelled";

  const handleContinueWithKakao = async () => {
    if (cacheState.status !== "ready" || oauthState.status === "redirecting") {
      return;
    }

    setOauthState({ status: "redirecting" });

    try {
      const response = await signIn.social({
        provider: "kakao",
        callbackURL: "/",
        errorCallbackURL: "/diagnosis?oauth=cancelled",
      });

      if (response.error) {
        setOauthState({ status: "start-error" });
      }
    } catch {
      setOauthState({ status: "start-error" });
    }
  };

  let kakaoButtonContent: ReactNode = (
    <>
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.545 1.574 4.778 4.01 6.164l-1.013 3.644c-.067.242.17.451.394.35l4.237-1.906C10.438 18.917 11.204 19 12 19c5.514 0 10-3.262 10-7.5S17.514 3 12 3z" />
      </svg>
      <span>카카오로 계속하고 결과 저장</span>
    </>
  );

  if (oauthState.status === "redirecting") {
    kakaoButtonContent = (
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
    );
  }

  return (
    <div className="min-h-screen bg-cream-canvas px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="tactile-card tactile-card--raised p-6 md:p-10">
          <CEFRLevelBadge cefrLevel={result.cefrLevel} totalScore={result.totalScore} />

          <WeaknessAreasList weaknessAreas={result.weaknessAreas} />

          <div className="mt-8 rounded-2xl border border-cobalt/20 bg-cobalt/[0.04] p-6 text-center">
            <h3 className="font-display text-xl font-bold text-ink md:text-2xl">
              결과를 저장하고 학습을 시작하세요
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              카카오로 계속하면 이 결과가 계정에 저장되고, 딱 맞는 레벨에서 학습이 시작돼요.
            </p>

            {cacheState.status === "saving" && (
              <div className="mt-6 rounded-xl bg-cobalt/10 px-4 py-4 text-sm font-semibold text-cobalt">
                진단 결과를 안전하게 보관하고 있어요.
              </div>
            )}

            {cacheState.status === "error" && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-rust">
                  결과를 임시 저장하지 못했어요. 저장한 뒤 카카오 로그인을 계속할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={cacheState.onRetryCacheSave}
                  className="tactile-btn tactile-btn--teal mt-4"
                >
                  결과 다시 저장
                </button>
              </div>
            )}

            {cacheState.status === "ready" && (
              <>
                {oauthDidNotComplete && oauthState.status !== "start-error" && (
                  <p className="mt-5 text-sm font-semibold text-rust">
                    카카오 로그인이 완료되지 않았어요. 진단 결과는 이 탭에 그대로 남아 있어요.
                  </p>
                )}

                {oauthState.status === "start-error" && (
                  <p className="mt-5 text-sm font-semibold text-rust">
                    카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void handleContinueWithKakao()}
                  disabled={oauthState.status === "redirecting"}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FEE500] px-6 py-4 font-bold text-[#191919] transition-colors hover:bg-[#f6dc00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {kakaoButtonContent}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
