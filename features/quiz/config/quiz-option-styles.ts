export const QUIZ_OPTION_STYLES = {
  selected:
    "border-violet-400 bg-gradient-to-r from-violet-500/30 to-indigo-500/30 shadow-xl shadow-violet-500/20 scale-[1.02]",
  selecting: "border-violet-300 bg-violet-400/20 scale-[0.98]",
  default: "border-white/20 hover:border-violet-400/50 hover:bg-white/10 hover:shadow-lg",
} as const;

export const QUIZ_OPTION_LABEL_STYLES = {
  selected: "border-violet-400 bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg",
  default:
    "border-white/30 bg-white/10 text-white/60 group-hover:border-violet-400/50 group-hover:text-white/80",
} as const;

export const QUIZ_OPTION_TEXT_STYLES = {
  selected: "text-white font-semibold",
  default: "text-white/80 group-hover:text-white",
} as const;

