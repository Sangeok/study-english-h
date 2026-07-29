import Link from "next/link";
import { Target } from "lucide-react";
import { tactileButtonClass } from "@/shared/ui";
import { ROUTES, TOEIC_READING_BAND } from "@/shared/constants";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
// 배럴 @/entities/user 가 아니라 직접 경로 — 그 배럴은 @/lib/db 를 무는 서버 리더도 export 한다.
import type { ProfileStats } from "@/entities/user/types";

interface DashboardHeroProps {
  level: string;
  streak: number;
  totalXP: number;
  hasCompletedDiagnosis: boolean;
  /** 현재 레벨 준비도 0-100 — 표시 전용. 승급 진입점은 홈 하나뿐이다(§2 목표 2). */
  levelProgress: number;
  promotionStatus: ProfileStats["promotionStatus"];
}

/** 승급 상태 보조 카피 — locked 는 준비도 숫자만 보여준다. */
const PROMOTION_CAPTION: Record<ProfileStats["promotionStatus"], string | null> = {
  eligible: "승급 시험을 볼 수 있어요",
  cooldown: "재응시 대기 중",
  "max-level": "최고 레벨",
  locked: null,
};

export function DashboardHero({
  level,
  streak,
  totalXP,
  hasCompletedDiagnosis,
  levelProgress,
  promotionStatus,
}: DashboardHeroProps) {
  const levelDisplay = hasCompletedDiagnosis ? level : "?";
  // Record<CefrLevel,…> 인덱싱 전에 좁힌다 — as CefrLevel 캐스팅은 비정규 값에서 undefined 가 된다.
  const parsedLevel = cefrLevelSchema.safeParse(level);
  const band = TOEIC_READING_BAND[parsedLevel.success ? parsedLevel.data : "A1"];
  const toeicCaption = band
    ? `토익 리딩 ${band.min}~${band.max}점대 (어휘 기준 참고치)`
    : "토익 측정 범위를 넘는 수준";
  const promotionCaption = PROMOTION_CAPTION[promotionStatus];

  return (
    <div className="grid lg:grid-cols-3 gap-5 mb-5">
      {/* Hero — teal filled, oversized level, decorative depth */}
      <div className="lg:col-span-2 relative overflow-hidden rounded-[28px] border border-teal-edge bg-teal p-8 text-white">
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-10 h-32 w-32 rounded-full bg-white/10" />
        <div
          className="absolute right-8 top-8 h-3 w-3 rounded-full bg-gold"
          aria-hidden
        />

        <div className="relative">
          <p className="mb-4 font-medium text-white/80">오늘도 꾸준히 가볼까요</p>
          <div className="flex flex-wrap items-end gap-5">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Level
              </p>
              <p className="font-display text-6xl font-bold leading-none tabular-nums md:text-7xl">
                {levelDisplay}
              </p>
              {hasCompletedDiagnosis && (
                <>
                  {/* P4: 토익 리딩 밴드 참고치 — 측정 주장이 아니다 */}
                  <p className="mt-1 text-xs text-white/70">{toeicCaption}</p>
                  {/* P4: 진행률 — 홈 패널과 같은 전진형 라벨("남은"이 아니라 "준비도") */}
                  <p className="mt-1 text-xs text-white/70">
                    현재 레벨 준비도{" "}
                    <span className="font-semibold tabular-nums text-white">
                      {levelProgress}%
                    </span>
                    {promotionCaption && ` · ${promotionCaption}`}
                  </p>
                </>
              )}
            </div>
            <div className="mb-1 flex gap-3">
              <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-2">
                <p className="text-xs text-white/75">연속</p>
                <p className="font-display text-3xl font-bold tabular-nums">
                  {streak}
                  <span className="ml-0.5 text-base font-semibold">일</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-2">
                <p className="text-xs text-white/75">총 XP</p>
                <p className="font-display text-3xl font-bold tabular-nums">
                  {totalXP.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {!hasCompletedDiagnosis && (
            <p className="mt-4 text-sm text-white/85">
              레벨 진단을 완료하면 나에게 맞는 퀴즈가 시작돼요.
            </p>
          )}
        </div>
      </div>

      {/* Today's quiz CTA */}
      <div className="tactile-card tactile-card--raised flex flex-col justify-between p-6">
        <div>
          <div className="tactile-tile mb-3 h-12 w-12 border-gold bg-gold-tint text-gold-edge">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="font-display text-xl font-bold text-ink">오늘의 퀴즈</h3>
          <p className="mt-1 text-sm text-ink-soft">하루 한 세트로 실력을 쌓아요</p>
        </div>
        <Link
          href={ROUTES.QUIZ}
          className={tactileButtonClass("teal", "lg", { block: true, className: "mt-5" })}
        >
          퀴즈 시작하기 →
        </Link>
      </div>
    </div>
  );
}
