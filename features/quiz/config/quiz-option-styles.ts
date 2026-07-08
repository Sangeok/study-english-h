export const QUIZ_OPTION_STYLES = {
  selected: "border-cobalt-lt bg-chamber-panel-hi",
  selecting: "border-cobalt-lt bg-chamber-panel-hi scale-[0.99]",
  default:
    "border-chamber-line bg-chamber-panel hover:border-cobalt-lt hover:-translate-y-0.5",
} as const;

export const QUIZ_OPTION_LABEL_STYLES = {
  selected: "bg-teal text-white",
  default: "bg-chamber-panel-hi text-chamber-soft group-hover:text-cobalt-lt",
} as const;

export const QUIZ_OPTION_TEXT_STYLES = {
  selected: "text-white font-bold",
  default: "text-chamber-ink/90 group-hover:text-chamber-ink",
} as const;
