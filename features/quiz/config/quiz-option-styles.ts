export const QUIZ_OPTION_STYLES = {
  selected:
    "border-teal bg-teal-tint shadow-[0_4px_0_0_var(--teal-edge)] -translate-y-0.5",
  selecting: "border-teal bg-teal-tint/70 scale-[0.99]",
  default:
    "border-border-warm bg-paper shadow-[0_3px_0_0_var(--border-warm)] hover:border-teal hover:bg-teal-tint/40 hover:-translate-y-0.5",
} as const;

export const QUIZ_OPTION_LABEL_STYLES = {
  selected: "border-teal-edge bg-teal text-white",
  default:
    "border-border-strong bg-muted-warm text-ink-soft group-hover:border-teal group-hover:text-teal-edge",
} as const;

export const QUIZ_OPTION_TEXT_STYLES = {
  selected: "text-ink font-bold",
  default: "text-ink/80 group-hover:text-ink",
} as const;
