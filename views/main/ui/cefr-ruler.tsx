import { getNextLevel } from "@/shared/constants";

const LEVEL_POSITION: Record<string, number> = {
  A1: 0,
  A2: 20,
  B1: 40,
  B2: 60,
  C1: 80,
  C2: 100,
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const SEGMENT_WIDTH_PERCENT = 20; // LEVEL_POSITION 이 레벨당 20%씩 증가하는 구간 폭

interface CefrRulerProps {
  /** null이면 미진단 상태 — 눈금만 보여주고 마커를 숨긴다 */
  level: string | null;
  /** 현재 레벨 구간 내 진행률 0-100. null(로딩 등)이면 마커를 숨긴다(가짜 값 금지). */
  progress?: number | null;
}

/**
 * 마커 위치(%). 네 갈래를 이른 반환으로 분리하고 마지막에 명시적으로 100 클램프한다.
 */
function computeMarkerPercent(level: string | null, progress: number | null): number | null {
  if (level === null) return null; // 미진단 — 마커 숨김
  if (getNextLevel(level) === null) return 100; // 최상위 레벨(다음 없음) — 리터럴 "C2" 대신 단일 출처
  if (progress === null) return null; // 진행 데이터 없음 — 마커 숨김(가짜 폴백 완전 제거)
  const position = LEVEL_POSITION[level] ?? 0;
  const filled = (Math.max(0, Math.min(100, progress)) / 100) * SEGMENT_WIDTH_PERCENT;
  return Math.min(100, position + filled); // 상한 명시 클램프
}

/**
 * CEFR 눈금자 — 시그니처 계측기 (ADR-0001).
 * P4: 마커 = 레벨 구간 시작 + 구간 폭 × 진행률. 최상위 레벨은 100 고정, 진행 데이터 없으면 숨김.
 */
export function CefrRuler({ level, progress = null }: CefrRulerProps) {
  const position = level ? (LEVEL_POSITION[level] ?? 0) : null; // 하단 LEVELS.map "done" 하이라이트용
  const marker = computeMarkerPercent(level, progress);

  return (
    <div role="img" aria-label={level ? `CEFR 진행도: 현재 ${level}` : "CEFR 진행도: 미진단"}>
      <div
        className="relative h-[26px]"
        style={{
          background: [
            "repeating-linear-gradient(90deg, rgba(199,211,232,0.55) 0 2px, transparent 2px 20%) bottom / 100% 18px no-repeat",
            "repeating-linear-gradient(90deg, rgba(199,211,232,0.22) 0 1px, transparent 1px 5%) bottom / 100% 10px no-repeat",
          ].join(", "),
        }}
      >
        {marker !== null && (
          <>
            <div
              className="absolute bottom-[-1px] left-0 h-1 rounded-sm bg-cobalt-lt shadow-[0_0_14px_rgba(110,155,255,0.55)]"
              style={{ width: `${marker}%` }}
            />
            <div
              className="absolute bottom-[-4px] h-3 w-3 -translate-x-1/2 rounded-full border-[2.5px] border-chamber bg-cobalt-lt shadow-[0_0_0_1.5px_var(--cobalt-lt),0_0_16px_rgba(110,155,255,0.8)]"
              style={{ left: `${marker}%` }}
            />
          </>
        )}
      </div>
      <div className="h-0.5 bg-[rgba(199,211,232,0.28)]" />
      <div className="mt-3 flex justify-between">
        {LEVELS.map((l) => {
          const done = position !== null && LEVEL_POSITION[l] < position;
          const now = level === l;
          return (
            <b
              key={l}
              className={[
                "w-[30px] text-center font-display text-[12.5px] font-bold tracking-[0.08em]",
                "first:text-left last:text-right",
                now ? "text-cobalt-lt" : done ? "text-chamber-soft" : "text-[#44567a]",
              ].join(" ")}
            >
              {l}
            </b>
          );
        })}
      </div>
    </div>
  );
}
