const LEVEL_POSITION: Record<string, number> = {
  A1: 0,
  A2: 20,
  B1: 40,
  B2: 60,
  C1: 80,
  C2: 100,
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

interface CefrRulerProps {
  /** null이면 미진단 상태 — 눈금만 보여주고 마커를 숨긴다 */
  level: string | null;
}

/**
 * CEFR 눈금자 — 시그니처 계측기 (ADR-0001).
 * 세부 진행 데이터가 없으므로 마커는 현재 레벨 구간의 중간(+10%)에 둔다.
 */
export function CefrRuler({ level }: CefrRulerProps) {
  const position = level ? (LEVEL_POSITION[level] ?? 0) : null;
  const marker = position === null ? null : Math.min(position + 10, 100);

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
