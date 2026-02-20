export type QuizResultStatus = "correct" | "incorrect";

export const QUIZ_RESULT_ITEM_STYLES = {
  correct: {
    background: "from-emerald-50 to-green-50",
    border: "border-emerald-200",
    iconBackground: "bg-gradient-to-br from-emerald-500 to-green-600",
    badge: "bg-emerald-100 text-emerald-700",
    mark: "✓",
    label: "정답",
  },
  incorrect: {
    background: "from-rose-50 to-pink-50",
    border: "border-rose-200",
    iconBackground: "bg-gradient-to-br from-rose-500 to-pink-600",
    badge: "bg-rose-100 text-rose-700",
    mark: "✗",
    label: "오답",
  },
} as const;

