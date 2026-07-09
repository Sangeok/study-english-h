export interface LeagueTier {
  tier: number;
  name: string;
  nameKo: string;
  minPoints: number;
}

export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { tier: 1, name: "Bronze", nameKo: "브론즈", minPoints: 0 },
  { tier: 2, name: "Silver", nameKo: "실버", minPoints: 1000 },
  { tier: 3, name: "Gold", nameKo: "골드", minPoints: 2000 },
  { tier: 4, name: "Platinum", nameKo: "플래티넘", minPoints: 4000 },
  { tier: 5, name: "Diamond", nameKo: "다이아몬드", minPoints: 6000 },
  { tier: 6, name: "Master", nameKo: "마스터", minPoints: 8000 },
];
