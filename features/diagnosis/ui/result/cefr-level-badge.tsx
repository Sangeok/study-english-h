import { CEFR_INFO } from "../../config";
import { CEFR_CAN_DO, TOEIC_READING_BAND } from "@/shared/constants";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";

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
  // CEFR_CAN_DO/TOEIC_READING_BAND 는 Record<CefrLevel,…> 라 자유 string 인덱싱은 undefined 다.
  //   CEFR_INFO 의 `?? CEFR_INFO.A1` 객체 폴백은 *키*가 아니라 값이라 여기 쓸 수 없다.
  const parsedLevel = cefrLevelSchema.safeParse(cefrLevel);
  const normalizedLevel = parsedLevel.success ? parsedLevel.data : "A1";
  const band = TOEIC_READING_BAND[normalizedLevel]; // C2 는 null
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

      {/* P4: can-do 앵커 — CEFR 를 기능 서술로 구체화 */}
      <p className="text-base text-ink-soft">{CEFR_CAN_DO[normalizedLevel]}</p>

      {/* P4: 토익 리딩 밴드 — 측정 주장이 아닌 참고치 (밴드·리딩 한정·라벨 3규칙) */}
      <p className="mt-2 text-sm text-ink-soft">
        {band
          ? `이 어휘 수준은 보통 토익 리딩 ${band.min}~${band.max}점대와 함께 가요 (어휘 기준 참고치)`
          : "토익 측정 범위를 넘는 수준이에요"}
      </p>

      <p className="mt-4 text-sm font-semibold text-ink">
        총점 <span className="text-gold-edge font-display font-bold tabular-nums">{totalScore}</span>점
      </p>
    </div>
  );
}
