import type { WeaknessArea } from "../types";

export function normalizeWeaknessAreas(
  weaknessAreas: Record<string, number> | null | undefined
): WeaknessArea[] {
  if (!weaknessAreas) return [];
  return Object.entries(weaknessAreas).map(([category, accuracy]) => ({
    category,
    accuracy,
  }));
}
