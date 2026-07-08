// Types (클라이언트/서버 공용)
export type {
  GamificationEvent,
  GamificationResult,
  StreakMilestoneResult,
  AchievementCheckContext,
  LeagueRankingEntry,
  StreakDetailResponse,
  AchievementResponse,
} from "./types";

// Config (클라이언트/서버 공용)
export { LEAGUE_TIERS } from "./config/league-tiers";
export type { LeagueTier } from "./config/league-tiers";
export { POINT_EVENTS } from "./config/point-events";
export type { PointEventType } from "./config/point-events";
export { STREAK_MILESTONES } from "./config/streak-milestones";
export type { StreakMilestone } from "./config/streak-milestones";
export { ACHIEVEMENTS } from "./config/achievements";
export type { AchievementDefinition } from "./config/achievements";

// Hooks (클라이언트 전용)
export { useMyLeague } from "./hooks/use-my-league";
export { useRewardToast } from "./hooks/use-reward-toast";

// UI Components (클라이언트 전용)
export { AchievementGallery } from "./ui/achievement-gallery";
export { LeagueLeaderboard } from "./ui/league-leaderboard";
export { LeagueProgress } from "./ui/league-progress";
export { StreakDetailCard } from "./ui/streak-detail-card";

// ⚠️ 서버 전용 함수는 barrel에서 제외
// addLeaguePoints, checkAchievements, processGamificationRewards 등은
// API 라우트에서 직접 경로로 import:
//   import { processGamificationRewards } from "@/features/gamification/lib/gamification-engine";
