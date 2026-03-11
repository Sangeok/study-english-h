import type { WeaknessArea } from "../types";

export function normalizeWeaknessAreas(
  weaknessAreas: WeaknessArea[] | Record<string, number> | null | undefined
): WeaknessArea[] {
  if (!weaknessAreas) return [];
  if (Array.isArray(weaknessAreas)) return weaknessAreas;
  return Object.entries(weaknessAreas).map(([category, accuracy]) => ({
    category,
    accuracy,
  }));
}
