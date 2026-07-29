"use client";

import type { ProfileStats } from "@/entities/user/types";
import { CefrRuler } from "./cefr-ruler";

interface LevelProgressPanelProps {
  diagnosisCompleted: boolean;
  level: string;
  /** 현재 레벨 준비도 0-100 */
  levelProgress: number;
  promotionStatus: ProfileStats["promotionStatus"];
  /** cooldown 일 때만 채워지는 ISO — 없으면 D-n 을 계산할 수 없다 */
  promotionAvailableAt: string | null;
  onStartPromotion: () => void;
}

/** 재응시까지 남은 일수 — 올림해서 "D-1" 이 "오늘 중" 을 뜻하지 않도록 한다. */
function daysUntil(isoDate: string): number {
  const remainingMs = new Date(isoDate).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

/**
 * 홈 우측 컬럼 — 눈금자 + 준비도 + 승급 CTA.
 * home-hero 비대화를 막으려고 분리했다. 승급 진입점은 이 패널 하나뿐이다(§2 목표 2).
 */
export function LevelProgressPanel({
  diagnosisCompleted,
  level,
  levelProgress,
  promotionStatus,
  promotionAvailableAt,
  onStartPromotion,
}: LevelProgressPanelProps) {
  return (
    <div>
      <CefrRuler
        level={diagnosisCompleted ? level : null}
        progress={diagnosisCompleted ? levelProgress : null}
      />

      {diagnosisCompleted && (
        <div className="mt-5">
          {/* 라벨은 전진형 — 눈금자 바가 levelProgress 까지 차므로 "남은"이 아니라 "준비도" */}
          <p className="text-[13px] text-chamber-soft">
            현재 레벨 준비도{" "}
            <span className="font-display font-bold tabular-nums text-white">
              {levelProgress}%
            </span>
          </p>

          {promotionStatus === "eligible" && (
            <button
              onClick={onStartPromotion}
              className="tactile-btn tactile-btn--gold tactile-btn--lg mt-3"
            >
              승급 시험 응시
            </button>
          )}

          {promotionStatus === "cooldown" && promotionAvailableAt && (
            <p className="mt-3 text-[13px] text-chamber-soft">
              재응시는 D-{daysUntil(promotionAvailableAt)} 후에 가능해요.
            </p>
          )}

          {promotionStatus === "max-level" && (
            <p className="mt-3 text-[13px] text-chamber-soft">
              최고 레벨을 유지하고 있어요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
