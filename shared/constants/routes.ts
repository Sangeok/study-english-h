export const ROUTES = {
  // views/main 이 렌더하는 홈. /main 라우트는 존재하지 않는다 — 경로 리터럴 대신 이 상수를 쓸 것.
  HOME: "/",
  LOGIN: "/login",
  QUIZ: "/quiz",
  DIAGNOSIS: "/diagnosis",
  FLASHCARD_MODES: "/flashcard/modes",
  DASHBOARD: "/dashboard",
  ACHIEVEMENTS: "/achievements",
  LEAGUE: "/league",
  SHOP: "/shop",
} as const;

export const QUERY_PARAMS = {
  MESSAGE: "message",
  DIAGNOSIS_COMPLETED: "diagnosis_completed",
} as const;
