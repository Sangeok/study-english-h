import { z } from "zod";
import { diagnosisSubmitRequestSchema } from "@/entities/question/lib/schemas";
import type { DiagnosisResult } from "../types";

export const GUEST_DIAGNOSIS_STORAGE_KEY = "guest-diagnosis";

const GUEST_DIAGNOSIS_CACHE_SCHEMA_VERSION = 1 as const;

const diagnosisResultSchema: z.ZodType<DiagnosisResult> = z.object({
  totalScore: z.number(),
  cefrLevel: z.string(),
  weaknessAreas: z.array(
    z.object({
      category: z.string(),
      accuracy: z.number(),
    })
  ),
  recommendedStartPoint: z.string(),
});

const cachedGuestDiagnosisSchema = z.object({
  cacheSchemaVersion: z.literal(GUEST_DIAGNOSIS_CACHE_SCHEMA_VERSION),
  answers: diagnosisSubmitRequestSchema.shape.answers,
  result: diagnosisResultSchema,
});

export type CachedGuestDiagnosis = z.infer<typeof cachedGuestDiagnosisSchema>;

export type GuestDiagnosisCacheInput = Omit<CachedGuestDiagnosis, "cacheSchemaVersion">;

export type GuestDiagnosisReadResult =
  | { status: "ready"; diagnosis: CachedGuestDiagnosis }
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "unavailable" };

export type GuestDiagnosisStorageMutationResult =
  | { status: "success" }
  | { status: "unavailable" };

export function saveGuestDiagnosis(
  diagnosis: GuestDiagnosisCacheInput
): GuestDiagnosisStorageMutationResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  const cachedDiagnosis: CachedGuestDiagnosis = {
    cacheSchemaVersion: GUEST_DIAGNOSIS_CACHE_SCHEMA_VERSION,
    ...diagnosis,
  };

  try {
    window.sessionStorage.setItem(
      GUEST_DIAGNOSIS_STORAGE_KEY,
      JSON.stringify(cachedDiagnosis)
    );
    return { status: "success" };
  } catch {
    return { status: "unavailable" };
  }
}

export function readGuestDiagnosis(): GuestDiagnosisReadResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  let rawDiagnosis: string | null;
  try {
    rawDiagnosis = window.sessionStorage.getItem(GUEST_DIAGNOSIS_STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }

  if (rawDiagnosis === null) return { status: "empty" };

  let parsedDiagnosis: unknown;
  try {
    parsedDiagnosis = JSON.parse(rawDiagnosis);
  } catch {
    return { status: "invalid" };
  }

  const validation = cachedGuestDiagnosisSchema.safeParse(parsedDiagnosis);
  if (!validation.success) return { status: "invalid" };

  return { status: "ready", diagnosis: validation.data };
}

export function clearGuestDiagnosis(): GuestDiagnosisStorageMutationResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  try {
    window.sessionStorage.removeItem(GUEST_DIAGNOSIS_STORAGE_KEY);
    return { status: "success" };
  } catch {
    return { status: "unavailable" };
  }
}
