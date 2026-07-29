/**
 * CEFR 레벨 canonical 정의 — 진단·퀴즈·프로필이 공유하는 단일 출처.
 *
 * zod 의존이 없어 클라이언트 배럴(shared/constants)에 안전하게 노출된다.
 * 런타임 검증 스키마가 필요하면 ./cefr-schema 의 cefrLevelSchema 를 직접 import 한다.
 */
export const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_ORDER)[number];

/** 다음 CEFR 레벨. 입력이 유효 CefrLevel 이 아니거나 최상위(C2)면 null.
 *  자유 String 인 profile.level 을 그대로 받도록 string 을 받아(호출부 캐스팅 불필요) 내부 판정한다 —
 *  승급 시험·홈 서사·눈금자가 "다음 레벨 없음"을 이 한 곳에서 공유한다. */
export function getNextLevel(level: string): CefrLevel | null {
  const index = (CEFR_ORDER as readonly string[]).indexOf(level);
  return index >= 0 && index < CEFR_ORDER.length - 1 ? CEFR_ORDER[index + 1] : null;
}

/**
 * 기준 레벨의 fallback 우선순위 레벨 목록(전체 6레벨을 우선순위 순으로).
 *
 * 순서: exact(거리 0) → 인접 하위(거리 1) → 인접 상위(거리 1) → 바깥으로 확장.
 * flashcard 신규 공급 fallback 이 이 순서로 in-memory 정렬해 exact-first 소진을 유지한다(RFC §7).
 * 입력은 정규화된 CefrLevel 이어야 한다(호출 전 cefrLevelSchema 로 safeParse).
 */
export function buildAdjacentPriority(level: CefrLevel): CefrLevel[] {
  const index = CEFR_ORDER.indexOf(level);
  const ordered: CefrLevel[] = [CEFR_ORDER[index]];
  for (let distance = 1; distance < CEFR_ORDER.length; distance++) {
    const lower = index - distance;
    const upper = index + distance;
    if (lower >= 0) ordered.push(CEFR_ORDER[lower]); // 인접 하위 우선
    if (upper < CEFR_ORDER.length) ordered.push(CEFR_ORDER[upper]); // 인접 상위
  }
  return ordered;
}
