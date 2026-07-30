import type { ListeningGapResponse } from "@/entities/user/model/use-listening-gap";

interface ListeningGapCardProps {
  /** null 이거나 { gap: null } 이면 렌더하지 않는다 — 표본 부족을 "갭 0" 으로 보여주지 않는다. */
  gap: ListeningGapResponse | undefined;
  isLoading: boolean;
}

/**
 * 읽기 대비 듣기 갭.
 *
 * 숫자 문법은 형제인 overview-stats.tsx 를 따른다(font-display · tabular-nums) —
 * ADR 0001 이 배지·마스코트식 표현 대신 정제된 숫자·타이포 중심을 요구한다.
 *
 * props 만 받는다. 데이터는 use-dashboard-data 가 조립해 index.tsx 가 내려준다 —
 * 카드가 훅을 직접 부르면 대시보드의 데이터 조립 지점이 둘로 갈린다.
 */
export function ListeningGapCard({ gap, isLoading }: ListeningGapCardProps) {
  if (isLoading || !gap || gap.gap === null) {
    return null;
  }

  const { readingRate, listeningRate } = gap;
  const isBehind = gap.gap > 0;

  return (
    <div className="mb-8 rounded-[22px] border border-chamber-line bg-chamber-panel p-6">
      <p className="text-sm font-semibold text-chamber-soft">읽기 대비 듣기</p>

      <div className="mt-3 flex items-end gap-8">
        <div>
          <p className="text-xs font-medium text-chamber-soft">읽기</p>
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums text-chamber-ink">
            {readingRate}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-chamber-soft">듣기</p>
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums text-cobalt-lt">
            {listeningRate}%
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-chamber-soft">
        {isBehind
          ? `듣기가 ${gap.gap}%p 뒤처져 있어요. 이 차이가 줄어드는 게 듣기 실력이 느는 신호예요.`
          : "듣기가 읽기를 따라잡았어요."}
      </p>
    </div>
  );
}
