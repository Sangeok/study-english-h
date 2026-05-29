export type QuizResultStatus = "correct" | "incorrect";

export const QUIZ_RESULT_ITEM_STYLES = {
  correct: {
    background: "bg-teal-tint",
    border: "border-teal",
    iconBackground: "bg-teal border-2 border-teal-edge",
    badge: "bg-teal text-white",
    mark: "✓",
    label: "정답",
  },
  incorrect: {
    background: "bg-coral-tint",
    border: "border-coral",
    iconBackground: "bg-coral border-2 border-coral-edge",
    badge: "bg-coral text-white",
    mark: "✗",
    label: "오답",
  },
} as const;
