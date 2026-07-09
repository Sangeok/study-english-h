import { CEFR_INFO } from "../../config";

interface CEFRLevelBadgeProps {
  cefrLevel: string;
  totalScore: number;
}

type Tone = "teal" | "ocean" | "coral" | "gold" | "grape";

// CEFR 레벨별 분위기 톤 (배너밴된 보라 그라데이션 대신 단색 타일 톤 사용)
const LEVEL_TONE: Record<string, Tone> = {
  A1: "teal",
  A2: "ocean",
  B1: "grape",
  B2: "ocean",
  C1: "gold",
  C2: "coral",
};

const TONE_SURFACE: Record<Tone, string> = {
  teal: "bg-teal border-teal-edge",
  ocean: "bg-ocean border-ocean-edge",
  coral: "bg-coral border-coral-edge",
  gold: "bg-gold border-gold-edge",
  grape: "bg-grape border-grape-edge",
};

export function CEFRLevelBadge({ cefrLevel, totalScore }: CEFRLevelBadgeProps) {
  const info = CEFR_INFO[cefrLevel] ?? CEFR_INFO.A1;
  const tone = LEVEL_TONE[cefrLevel] ?? "teal";
  // 골드는 흰 글씨 대비가 약해 잉크 텍스트 사용
  const textOnSurface = tone === "gold" ? "text-ink" : "text-white";
  const subOnSurface = tone === "gold" ? "text-ink/70" : "text-white/80";

  return (
    <div className="mb-8 animate-[pop-in] text-center">
      {/* 레벨 히어로 — 단색 블록, 거대한 디스플레이 레벨 */}
      <div
        className={`relative mx-auto mb-6 overflow-hidden rounded-[28px] border p-8 ${TONE_SURFACE[tone]} ${textOnSurface}`}
      >
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative">
          <p
            className={`font-display text-xs font-semibold uppercase tracking-[0.3em] ${subOnSurface}`}
          >
            Your CEFR Level
          </p>
          <p className="font-display text-7xl font-bold leading-none tabular-nums md:text-8xl">
            {cefrLevel}
          </p>
          <p className={`mt-2 font-display text-lg font-bold ${textOnSurface}`}>
            {info.title}
          </p>
        </div>
      </div>

      <p className="text-base text-ink-soft">{info.description}</p>

      <p className="mt-4 text-sm font-semibold text-ink">
        총점 <span className="text-gold-edge font-display font-bold tabular-nums">{totalScore}</span>점
      </p>
    </div>
  );
}
