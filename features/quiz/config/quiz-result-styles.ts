export type QuizResultStatus = "correct" | "incorrect";

export const QUIZ_RESULT_ITEM_STYLES = {
  correct: {
    background: "bg-meadow-tint",
    border: "border-meadow",
    iconBackground: "bg-meadow",
    badge: "bg-meadow text-white",
    mark: "✓",
    label: "정답",
  },
  incorrect: {
    background: "bg-coral-tint",
    border: "border-coral",
    iconBackground: "bg-coral",
    badge: "bg-coral text-white",
    mark: "✗",
    label: "오답",
  },
} as const;
