import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
  post: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();

  return {
    ...actual,
    apiClient: {
      get: apiClientMocks.get,
      post: apiClientMocks.post,
    },
  };
});

import { ApiError } from "@/shared/lib";
import {
  migrateGuestDiagnosis,
  type DiagnosisStatusResponse,
  type DiagnosisSubmitResponse,
} from "./diagnosis-api";

const MIGRATION_REQUEST = {
  answers: [{ questionId: "question-1", selectedText: "answer" }],
};

const INCOMPLETE_STATUS = {
  hasCompleted: false,
  cefrLevel: null,
  completedAt: null,
  canRetake: true,
  daysUntilRetake: 0,
} satisfies DiagnosisStatusResponse;

const COMPLETED_STATUS = {
  hasCompleted: true,
  cefrLevel: "B1",
  completedAt: "2026-07-13T00:00:00.000Z",
  canRetake: false,
  daysUntilRetake: 30,
} satisfies DiagnosisStatusResponse;

const CREATED_DIAGNOSIS = {
  diagnosisId: "diagnosis-new",
  totalScore: 42,
  cefrLevel: "B1",
  weaknessAreas: [{ category: "Vocabulary", accuracy: 55 }],
  recommendedStartPoint: "B1-unit-1",
} satisfies DiagnosisSubmitResponse;

beforeEach(() => {
  apiClientMocks.get.mockReset();
  apiClientMocks.post.mockReset();
});

describe("migrateGuestDiagnosis", () => {
  it("기존 진단이 있으면 제출하지 않고 이미 완료된 결과를 반환한다", async () => {
    apiClientMocks.get.mockResolvedValueOnce(COMPLETED_STATUS);

    const result = await migrateGuestDiagnosis(MIGRATION_REQUEST);

    expect(result).toEqual({ outcome: "already-completed" });
    expect(apiClientMocks.get).toHaveBeenCalledWith("/api/diagnosis/status");
    expect(apiClientMocks.post).not.toHaveBeenCalled();
  });

  it("기존 진단이 없고 제출이 성공하면 생성된 진단 ID를 반환한다", async () => {
    apiClientMocks.get.mockResolvedValueOnce(INCOMPLETE_STATUS);
    apiClientMocks.post.mockResolvedValueOnce(CREATED_DIAGNOSIS);

    const result = await migrateGuestDiagnosis(MIGRATION_REQUEST);

    expect(result).toEqual({
      outcome: "created",
      diagnosisId: CREATED_DIAGNOSIS.diagnosisId,
    });
    expect(apiClientMocks.post).toHaveBeenCalledWith(
      "/api/diagnosis/submit",
      MIGRATION_REQUEST
    );
  });

  it("제출이 409여도 재조회에서 완료가 확인되면 이미 완료된 결과를 반환한다", async () => {
    const conflictError = new ApiError(409, "DIAGNOSIS_ALREADY_COMPLETED");
    apiClientMocks.get
      .mockResolvedValueOnce(INCOMPLETE_STATUS)
      .mockResolvedValueOnce(COMPLETED_STATUS);
    apiClientMocks.post.mockRejectedValueOnce(conflictError);

    const result = await migrateGuestDiagnosis(MIGRATION_REQUEST);

    expect(result).toEqual({ outcome: "already-completed" });
    expect(apiClientMocks.get).toHaveBeenCalledTimes(2);
  });

  it("제출 409 뒤 완료가 확인되지 않으면 원래 오류를 다시 던진다", async () => {
    const conflictError = new ApiError(409, "DIAGNOSIS_ALREADY_COMPLETED");
    apiClientMocks.get
      .mockResolvedValueOnce(INCOMPLETE_STATUS)
      .mockResolvedValueOnce(INCOMPLETE_STATUS);
    apiClientMocks.post.mockRejectedValueOnce(conflictError);

    await expect(migrateGuestDiagnosis(MIGRATION_REQUEST)).rejects.toBe(
      conflictError
    );
    expect(apiClientMocks.get).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["401", () => new ApiError(401, "UNAUTHORIZED")],
    ["네트워크", () => new Error("network failed")],
    ["500", () => new ApiError(500, "INTERNAL_SERVER_ERROR")],
  ])("제출의 %s 오류를 그대로 전파한다", async (_label, createError) => {
    const submissionError = createError();
    apiClientMocks.get.mockResolvedValueOnce(INCOMPLETE_STATUS);
    apiClientMocks.post.mockRejectedValueOnce(submissionError);

    await expect(migrateGuestDiagnosis(MIGRATION_REQUEST)).rejects.toBe(
      submissionError
    );
    expect(apiClientMocks.get).toHaveBeenCalledOnce();
  });
});
