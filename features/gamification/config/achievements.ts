export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: "learning" | "streak" | "accuracy" | "league" | "special";
  requirement: number;
  xpReward: number;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // 학습 배지
  { code: "first_step", name: "First Step", description: "첫 레슨 완료", icon: "🏆", category: "learning", requirement: 1, xpReward: 50 },
  { code: "vocab_10", name: "Vocab 10", description: "10개 단어 학습", icon: "📚", category: "learning", requirement: 10, xpReward: 50 },
  { code: "vocab_50", name: "Vocab 50", description: "50개 단어 학습", icon: "📚", category: "learning", requirement: 50, xpReward: 100 },
  { code: "vocab_100", name: "Vocab 100", description: "100개 단어 학습", icon: "📚", category: "learning", requirement: 100, xpReward: 150 },
  { code: "vocab_500", name: "Vocab 500", description: "500개 단어 학습", icon: "📚", category: "learning", requirement: 500, xpReward: 300 },

  // 스트릭 배지
  { code: "streak_7", name: "7-Day Streak", description: "7일 연속 학습", icon: "🔥", category: "streak", requirement: 7, xpReward: 50 },
  { code: "streak_14", name: "14-Day Streak", description: "14일 연속 학습", icon: "⚡", category: "streak", requirement: 14, xpReward: 100 },
  { code: "streak_30", name: "30-Day Streak", description: "30일 연속 학습", icon: "⚡", category: "streak", requirement: 30, xpReward: 300 },
  { code: "streak_100", name: "100-Day Streak", description: "100일 연속 학습", icon: "💯", category: "streak", requirement: 100, xpReward: 1000 },

  // 정확도 배지
  { code: "accuracy_80", name: "Accuracy 80%", description: "정확도 80% 이상", icon: "✨", category: "accuracy", requirement: 80, xpReward: 100 },
  { code: "perfect_day", name: "Perfect Day", description: "하루 완벽 정확도", icon: "✨", category: "accuracy", requirement: 100, xpReward: 150 },

  // 리그 배지
  { code: "bronze_league", name: "Bronze", description: "브론즈 리그 달성", icon: "🥉", category: "league", requirement: 1, xpReward: 50 },
  { code: "silver_league", name: "Silver", description: "실버 리그 달성", icon: "🥈", category: "league", requirement: 2, xpReward: 100 },
  { code: "gold_league", name: "Gold", description: "골드 리그 달성", icon: "🥇", category: "league", requirement: 3, xpReward: 200 },

  // 특별 배지
  { code: "early_adopter", name: "Early Adopter", description: "초기 가입자", icon: "🎁", category: "special", requirement: 1, xpReward: 100 },
];
