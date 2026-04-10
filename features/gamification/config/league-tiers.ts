export interface LeagueTier {
  tier: number;
  name: string;
  nameKo: string;
  minPoints: number;
  icon: string;
  color: string;
}

export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { tier: 1, name: "Bronze", nameKo: "브론즈", minPoints: 0, icon: "🥉", color: "#CD7F32" },
  { tier: 2, name: "Silver", nameKo: "실버", minPoints: 1000, icon: "🥈", color: "#C0C0C0" },
  { tier: 3, name: "Gold", nameKo: "골드", minPoints: 2000, icon: "🥇", color: "#FFD700" },
  { tier: 4, name: "Platinum", nameKo: "플래티넘", minPoints: 4000, icon: "💎", color: "#E5E4E2" },
  { tier: 5, name: "Diamond", nameKo: "다이아몬드", minPoints: 6000, icon: "💠", color: "#B9F2FF" },
  { tier: 6, name: "Master", nameKo: "마스터", minPoints: 8000, icon: "🌟", color: "#9C27B0" },
];
