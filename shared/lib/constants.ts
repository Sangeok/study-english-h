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
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "🌱",
    glow: "shadow-emerald-200",
    gradient: "from-emerald-500 to-green-600",
  },
  medium: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "⚡",
    glow: "shadow-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
  hard: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "🔥",
    glow: "shadow-rose-200",
    gradient: "from-rose-500 to-pink-600",
  },
};

export function getDifficultyStyle(difficulty: string): DifficultyStyle {
  return DIFFICULTY_STYLES[difficulty.toLowerCase()] ?? DIFFICULTY_STYLES.medium;
}

// 진단 관련 상수
export const DIAGNOSIS_TIME_LIMIT_SECONDS = 300; // 5분

// 퀴즈 관련 상수
export const DEFAULT_QUIZ_COUNT = 10;
export const WEAKNESS_QUESTION_RATIO = 0.5; // 50%
