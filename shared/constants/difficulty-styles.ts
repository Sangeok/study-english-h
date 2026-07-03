export interface DifficultyStyle {
  bg: string;
  text: string;
  border: string;
  icon: string;
  glow: string;
  gradient: string;
}

const DIFFICULTY_STYLES: Record<string, DifficultyStyle> = {
  easy: {
    bg: "bg-teal-tint",
    text: "text-teal-edge",
    border: "border-teal",
    icon: "🌱",
    glow: "shadow-teal-tint",
    gradient: "from-teal to-teal-edge",
  },
  medium: {
    bg: "bg-gold-tint",
    text: "text-gold-edge",
    border: "border-gold",
    icon: "⚡",
    glow: "shadow-gold-tint",
    gradient: "from-gold to-gold-edge",
  },
  hard: {
    bg: "bg-coral-tint",
    text: "text-coral-edge",
    border: "border-coral",
    icon: "🔥",
    glow: "shadow-coral-tint",
    gradient: "from-coral to-coral-edge",
  },
};

export function getDifficultyStyle(difficulty: string): DifficultyStyle {
  return DIFFICULTY_STYLES[difficulty.toLowerCase()] ?? DIFFICULTY_STYLES.medium;
}
