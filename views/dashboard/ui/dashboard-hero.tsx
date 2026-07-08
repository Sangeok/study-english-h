import Link from "next/link";
import { Target } from "lucide-react";
import { tactileButtonClass } from "@/shared/ui";
import { ROUTES } from "@/shared/constants";

interface DashboardHeroProps {
  level: string;
  streak: number;
  totalXP: number;
  hasCompletedDiagnosis: boolean;
}

export function DashboardHero({
  level,
  streak,
  totalXP,
  hasCompletedDiagnosis,
}: DashboardHeroProps) {
  const levelDisplay = hasCompletedDiagnosis ? level : "?";

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
