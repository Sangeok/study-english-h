export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserProfile {
  userId: string;
  level?: CefrLevel;
  totalXP?: number;
  lastStudyDate?: Date;
  weaknessAreas?: Record<string, number>;
}
