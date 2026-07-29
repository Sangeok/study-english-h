import type { CefrLevel } from "./cefr";

/**
 * CEFR 레벨 서사 — can-do 앵커와 토익 리딩 밴드 참고치.
 *
 * 토익 3규칙(P4 결정): 점수 한 개가 아닌 밴드 / 리딩 섹션(5~495) 한정 / "어휘 기준 참고치" 라벨 필수.
 * 측정 주장이 아니다 — 리스닝 모드 도입 후 L+R 밴드로 확장한다.
 * C2 는 공개 매핑이 다루지 않아 null — "토익 측정 범위를 넘는 수준" 카피로 처리.
 */
export const CEFR_CAN_DO: Record<CefrLevel, string> = {
  A1: "인사·자기소개 같은 아주 기초적인 표현을 이해하고 쓸 수 있어요",
  A2: "쇼핑·길찾기 등 일상적인 상황에서 간단한 대화를 주고받을 수 있어요",
  B1: "여행 중 문제를 해결하고, 관심 분야의 글을 읽고 요지를 잡을 수 있어요",
  B2: "익숙한 주제라면 원어민과 무리 없이 토론하고, 기사·보고서를 읽을 수 있어요",
  C1: "업무·학업에서 복잡한 글을 이해하고 유창하게 의견을 펼칠 수 있어요",
  C2: "사실상 원어민처럼 미묘한 뉘앙스까지 이해하고 표현할 수 있어요",
};

/** 토익 리딩 섹션(5~495) 밴드 — ETS 공개 CEFR 매핑 통용치 기준 (Open Questions: 원문 검증) */
export const TOEIC_READING_BAND: Record<CefrLevel, { min: number; max: number } | null> = {
  A1: { min: 60, max: 110 },
  A2: { min: 115, max: 270 },
  B1: { min: 275, max: 380 },
  B2: { min: 385, max: 450 },
  C1: { min: 455, max: 495 },
  C2: null,
};
