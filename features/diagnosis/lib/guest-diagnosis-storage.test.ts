import { beforeEach, describe, expect, it } from "vitest";
import {
  saveGuestDiagnosis,
  readGuestDiagnosis,
  clearGuestDiagnosis,
  type GuestDiagnosis,
} from "./guest-diagnosis-storage";

const SAMPLE: GuestDiagnosis = {
  answers: [
    { questionId: "q1", selectedText: "apple" },
    { questionId: "q2", selectedText: "" },
  ],
  result: {
    totalScore: 42,
    cefrLevel: "B1",
    weaknessAreas: [{ category: "Vocabulary", accuracy: 55 }],
    recommendedStartPoint: "B1-unit-1",
  },
};

describe("guest-diagnosis-storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("save 후 read는 동일 데이터를 반환한다(라운드트립)", () => {
    saveGuestDiagnosis(SAMPLE);
    expect(readGuestDiagnosis()).toEqual(SAMPLE);
  });

  it("저장된 값이 없으면 null을 반환한다", () => {
    expect(readGuestDiagnosis()).toBeNull();
  });

  it("clear 후 read는 null을 반환한다", () => {
    saveGuestDiagnosis(SAMPLE);
    clearGuestDiagnosis();
    expect(readGuestDiagnosis()).toBeNull();
  });

  it("손상된 JSON이면 throw 없이 null을 반환한다", () => {
    // 내부 키를 하드코딩하지 않도록, 실제 save가 쓴 키를 찾아 손상시킨다.
    saveGuestDiagnosis(SAMPLE);
    const key = window.sessionStorage.key(0);
    expect(key).not.toBeNull();
    window.sessionStorage.setItem(key as string, "{ not valid json");
    expect(readGuestDiagnosis()).toBeNull();
  });
});
