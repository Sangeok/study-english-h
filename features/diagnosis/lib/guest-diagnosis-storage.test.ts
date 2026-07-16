import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_DIAGNOSIS_STORAGE_KEY,
  clearGuestDiagnosis,
  readGuestDiagnosis,
  saveGuestDiagnosis,
  type CachedGuestDiagnosis,
  type GuestDiagnosisCacheInput,
} from "./guest-diagnosis-storage";

const SAMPLE_DIAGNOSIS: GuestDiagnosisCacheInput = {
  answers: Array.from({ length: 20 }, (_, index) => ({
    questionId: `question-${index + 1}`,
    selectedText: index % 2 === 0 ? "apple" : "",
  })),
  result: {
    totalScore: 42,
    cefrLevel: "B1",
    weaknessAreas: [{ category: "Vocabulary", accuracy: 55 }],
    recommendedStartPoint: "B1-unit-1",
  },
};

const CACHED_SAMPLE_DIAGNOSIS: CachedGuestDiagnosis = {
  cacheSchemaVersion: 1,
  ...SAMPLE_DIAGNOSIS,
};

describe("guest-diagnosis-storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should store cache schema version 1 when saving a diagnosis", () => {
    expect(saveGuestDiagnosis(SAMPLE_DIAGNOSIS)).toEqual({ status: "success" });

    const rawDiagnosis = window.sessionStorage.getItem(GUEST_DIAGNOSIS_STORAGE_KEY);
    expect(JSON.parse(rawDiagnosis as string)).toEqual(CACHED_SAMPLE_DIAGNOSIS);
  });

  it("should return a ready result with the versioned diagnosis after saving", () => {
    saveGuestDiagnosis(SAMPLE_DIAGNOSIS);

    expect(readGuestDiagnosis()).toEqual({
      status: "ready",
      diagnosis: CACHED_SAMPLE_DIAGNOSIS,
    });
  });

  it("should return empty when no diagnosis is stored", () => {
    expect(readGuestDiagnosis()).toEqual({ status: "empty" });
  });

  it("should remove a stored diagnosis when clearing succeeds", () => {
    saveGuestDiagnosis(SAMPLE_DIAGNOSIS);

    expect(clearGuestDiagnosis()).toEqual({ status: "success" });
    expect(readGuestDiagnosis()).toEqual({ status: "empty" });
  });

  it("should return invalid for malformed JSON", () => {
    window.sessionStorage.setItem(GUEST_DIAGNOSIS_STORAGE_KEY, "{ not valid json");

    expect(readGuestDiagnosis()).toEqual({ status: "invalid" });
  });

  it("should return invalid when the stored diagnosis has the wrong shape", () => {
    window.sessionStorage.setItem(
      GUEST_DIAGNOSIS_STORAGE_KEY,
      JSON.stringify({ cacheSchemaVersion: 1, answers: [], result: {} })
    );

    expect(readGuestDiagnosis()).toEqual({ status: "invalid" });
  });

  it("should return invalid when the cache schema version does not match", () => {
    window.sessionStorage.setItem(
      GUEST_DIAGNOSIS_STORAGE_KEY,
      JSON.stringify({ ...CACHED_SAMPLE_DIAGNOSIS, cacheSchemaVersion: 2 })
    );

    expect(readGuestDiagnosis()).toEqual({ status: "invalid" });
  });

  it("should keep invalid data in storage after reading it", () => {
    const invalidDiagnosis = JSON.stringify({ cacheSchemaVersion: 1, answers: [] });
    window.sessionStorage.setItem(GUEST_DIAGNOSIS_STORAGE_KEY, invalidDiagnosis);

    expect(readGuestDiagnosis()).toEqual({ status: "invalid" });
    expect(window.sessionStorage.getItem(GUEST_DIAGNOSIS_STORAGE_KEY)).toBe(
      invalidDiagnosis
    );
  });

  it("should return unavailable when session storage cannot be read", () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("read unavailable");
    });

    expect(readGuestDiagnosis()).toEqual({ status: "unavailable" });
  });

  it("should return unavailable when session storage cannot be written", () => {
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("write unavailable");
    });

    expect(saveGuestDiagnosis(SAMPLE_DIAGNOSIS)).toEqual({ status: "unavailable" });
  });

  it("should return unavailable when session storage cannot be cleared", () => {
    vi.spyOn(window.sessionStorage, "removeItem").mockImplementation(() => {
      throw new Error("remove unavailable");
    });

    expect(clearGuestDiagnosis()).toEqual({ status: "unavailable" });
  });

  it("should return unavailable for all operations during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(readGuestDiagnosis()).toEqual({ status: "unavailable" });
    expect(saveGuestDiagnosis(SAMPLE_DIAGNOSIS)).toEqual({ status: "unavailable" });
    expect(clearGuestDiagnosis()).toEqual({ status: "unavailable" });
  });
});
