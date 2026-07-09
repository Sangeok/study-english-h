export const PERIOD_OPTIONS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
  { value: "all", label: "최근 3개월" },
] as const;

// Premium Modern palette — teal(cobalt) · coral(ember) · gold(amber) · ocean · grape(slate)
export const PIE_COLORS = ["#2E6BFF", "#F9701A", "#E8A23D", "#6E9BFF", "#3E5578"];

export const CATEGORY_LABELS: Record<string, string> = {
  daily: "일상",
  business: "비즈니스",
  toeic: "토익",
  travel: "여행",
  idioms: "숙어",
};
