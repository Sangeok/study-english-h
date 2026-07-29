export const ROUTES = {
  // views/main 이 렌더하는 홈. /main 라우트는 존재하지 않는다 — 경로 리터럴 대신 이 상수를 쓸 것.
  HOME: "/",
  LOGIN: "/login",
  QUIZ: "/quiz",
  DIAGNOSIS: "/diagnosis",
  // 복습 세션 직행. 진입점은 전부 이 경로를 쓴다(ADR 0002) — 목적(복습)이 URL 에 드러난다.
  FLASHCARD_REVIEW: "/flashcard?mode=review",
  // 형식 선택 화면. 매칭·타이핑·리스닝이 실제로 생기기 전까지 어디서도 링크하지 않는다(ADR 0002).
  FLASHCARD_MODES: "/flashcard/modes",
  PROMOTION: "/promotion",
  DASHBOARD: "/dashboard",
  ACHIEVEMENTS: "/achievements",
  LEAGUE: "/league",
  SHOP: "/shop",
} as const;

export const QUERY_PARAMS = {
  MESSAGE: "message",
  DIAGNOSIS_COMPLETED: "diagnosis_completed",
} as const;
