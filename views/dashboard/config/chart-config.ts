export const PERIOD_OPTIONS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
  { value: "all", label: "최근 3개월" },
] as const;

// Playful Tactile palette: teal · coral · gold · ocean · grape
export const PIE_COLORS = ["#12b886", "#ff6b6b", "#ffb020", "#4dabf7", "#9775fa"];

export const CATEGORY_LABELS: Record<string, string> = {
  daily: "일상",
  business: "비즈니스",
  toeic: "토익",
  travel: "여행",
  idioms: "숙어",
};
