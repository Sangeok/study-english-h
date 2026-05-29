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

const TONE_EDGE: Record<Tone, string> = {
  teal: "var(--teal-edge)",
  ocean: "var(--ocean-edge)",
  coral: "var(--coral-edge)",
  gold: "var(--gold-edge)",
  grape: "var(--grape-edge)",
};

const TONE_GLOW: Record<Tone, string> = {
  teal: "rgba(18,184,134,.55)",
  ocean: "rgba(77,171,247,.55)",
  coral: "rgba(255,107,107,.55)",
  gold: "rgba(255,176,32,.55)",
  grape: "rgba(151,117,250,.55)",
};

export function CEFRLevelBadge({ cefrLevel, totalScore }: CEFRLevelBadgeProps) {
  const info = CEFR_INFO[cefrLevel] ?? CEFR_INFO.A1;
  const tone = LEVEL_TONE[cefrLevel] ?? "teal";
  // 골드는 흰 글씨 대비가 약해 잉크 텍스트 사용
  const textOnSurface = tone === "gold" ? "text-ink" : "text-white";
  const subOnSurface = tone === "gold" ? "text-ink/70" : "text-white/80";

  return (
    <div className="mb-8 animate-[pop-in] text-center">
      {/* 레벨 히어로 — 단색 블록, 거대한 Fredoka 레벨 */}
      <div
        className={`relative mx-auto mb-6 overflow-hidden rounded-[28px] border-2 p-8 ${TONE_SURFACE[tone]} ${textOnSurface}`}
        style={{
          boxShadow: `0 6px 0 0 ${TONE_EDGE[tone]}, 0 28px 44px -26px ${TONE_GLOW[tone]}`,
        }}
      >
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-white/10" />
        <span
          className="pointer-events-none absolute right-6 top-6 text-3xl"
          aria-hidden
        >
          🎉
        </span>

        <div className="relative">
          <p
            className={`font-display text-xs font-semibold uppercase tracking-[0.3em] ${subOnSurface}`}
          >
            Your CEFR Level
          </p>
          <p className="font-display text-7xl font-bold leading-none md:text-8xl">
            {cefrLevel}
          </p>
          <p className={`mt-2 font-display text-lg font-bold ${textOnSurface}`}>
            {info.title}
          </p>
        </div>
      </div>

      <p className="text-base text-ink-soft">{info.description}</p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-gold bg-gold-tint px-4 py-2">
        <span className="text-base">⭐</span>
        <span className="text-sm font-semibold text-ink">
          총점 <span className="font-display font-bold text-gold-edge">{totalScore}</span>점
        </span>
      </div>
    </div>
  );
}
