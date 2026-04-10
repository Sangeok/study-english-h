export const PERIOD_OPTIONS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
  { value: "all", label: "최근 3개월" },
] as const;

export const PIE_COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

export const CATEGORY_LABELS: Record<string, string> = {
  daily: "일상",
  business: "비즈니스",
  toeic: "토익",
  travel: "여행",
  idioms: "숙어",
};
