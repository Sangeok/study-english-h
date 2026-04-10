export interface StreakMilestone {
  days: number;
  xpReward: number;
  freezeReward: number;
}

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  { days: 7, xpReward: 50, freezeReward: 1 },
  { days: 14, xpReward: 100, freezeReward: 1 },
  { days: 30, xpReward: 300, freezeReward: 2 },
  { days: 100, xpReward: 1000, freezeReward: 3 },
];
