import { ROUTES } from "@/shared/constants/routes";

// 공유 경로는 shared 상수를 참조해 이중 정의를 방지하고, flashcard 전용 경로만 리터럴로 유지한다.
export const FLASHCARD_ROUTES = {
  home: ROUTES.HOME,
  modes: ROUTES.FLASHCARD_MODES,
  result: "/flashcard/result",
  session: "/flashcard",
} as const;
