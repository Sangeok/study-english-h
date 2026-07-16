import {
  act,
  createRef,
  StrictMode,
  useImperativeHandle,
  type RefObject,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  migrateGuestDiagnosis,
  type GuestDiagnosisMigrationOutcome,
} from "../api/diagnosis-api";
import {
  clearGuestDiagnosis,
  readGuestDiagnosis,
  type CachedGuestDiagnosis,
} from "../lib/guest-diagnosis-storage";
import {
  useGuestDiagnosisMigration,
  type GuestDiagnosisMigrationState,
} from "./use-guest-diagnosis-migration";

const mocks = vi.hoisted(() => {
  const invalidateQueries = vi.fn();
  const refresh = vi.fn();

  return {
    clearGuestDiagnosis: vi.fn(),
    invalidateQueries,
    migrateGuestDiagnosis: vi.fn(),
    queryClient: { invalidateQueries },
    readGuestDiagnosis: vi.fn(),
    refresh,
    router: { refresh },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mocks.queryClient,
}));

vi.mock("../api/diagnosis-api", () => ({
  migrateGuestDiagnosis: mocks.migrateGuestDiagnosis,
}));

vi.mock("../lib/guest-diagnosis-storage", () => ({
  clearGuestDiagnosis: mocks.clearGuestDiagnosis,
  readGuestDiagnosis: mocks.readGuestDiagnosis,
}));

const CACHED_DIAGNOSIS: CachedGuestDiagnosis = {
  cacheSchemaVersion: 1,
  answers: [{ questionId: "question-1", selectedText: "answer" }],
  result: {
    totalScore: 75,
    cefrLevel: "B2",
    weaknessAreas: [{ category: "grammar", accuracy: 55 }],
    recommendedStartPoint: "B2-unit-1",
  },
};

const CREATED_OUTCOME = {
  outcome: "created",
  diagnosisId: "diagnosis-new",
} as const;

const ALREADY_COMPLETED_OUTCOME = {
  outcome: "already-completed",
} as const;

const CACHE_ERROR_CASES = [
  {
    label: "손상된 캐시",
    readResult: { status: "invalid" },
    reason: "invalid-cache",
  },
  {
    label: "접근할 수 없는 저장소",
    readResult: { status: "unavailable" },
    reason: "storage-unavailable",
  },
] as const;

const MIGRATION_FAILURE_CASES = [
  { label: "401 응답", error: new Error("401 Unauthorized") },
  { label: "네트워크 오류", error: new TypeError("Failed to fetch") },
  { label: "500 응답", error: new Error("500 Internal Server Error") },
] as const;

const SUCCESS_OUTCOMES = [
  { label: "created", outcome: CREATED_OUTCOME },
  { label: "already-completed", outcome: ALREADY_COMPLETED_OUTCOME },
] satisfies ReadonlyArray<{
  label: string;
  outcome: GuestDiagnosisMigrationOutcome;
}>;

const ASYNC_FLUSH_TURNS = 8;

type MigrationHookResult = ReturnType<typeof useGuestDiagnosisMigration>;

type MigrationHookHarnessProps = {
  resultRef: RefObject<MigrationHookResult | null>;
};

const clearGuestDiagnosisMock = vi.mocked(clearGuestDiagnosis);
const migrateGuestDiagnosisMock = vi.mocked(migrateGuestDiagnosis);
const readGuestDiagnosisMock = vi.mocked(readGuestDiagnosis);

let container: HTMLDivElement;
let resultRef: RefObject<MigrationHookResult | null>;
let root: Root;

function MigrationHookHarness({ resultRef }: MigrationHookHarnessProps): null {
  const result = useGuestDiagnosisMigration(true);
  useImperativeHandle(resultRef, () => result, [result]);

  return null;
}

function getLatestResult(): MigrationHookResult {
  if (!resultRef.current) {
    throw new Error("마이그레이션 훅 결과가 아직 준비되지 않았습니다.");
  }

  return resultRef.current;
}

async function flushAsyncWork(): Promise<void> {
  await act(async () => {
    for (let turn = 0; turn < ASYNC_FLUSH_TURNS; turn += 1) {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    }
  });
}

async function renderMigrationHook(): Promise<void> {
  await act(async () => {
    root.render(<MigrationHookHarness resultRef={resultRef} />);
  });
  await flushAsyncWork();
}

async function runHookAction(action: () => void): Promise<void> {
  await act(async () => {
    action();
  });
  await flushAsyncWork();
}

function expectState(state: GuestDiagnosisMigrationState): void {
  expect(getLatestResult().state).toEqual(state);
}

function expectRefreshSequence(): void {
  expect(mocks.invalidateQueries).toHaveBeenNthCalledWith(1, {
    queryKey: ["diagnosis"],
  });
  expect(mocks.invalidateQueries).toHaveBeenNthCalledWith(2, {
    queryKey: ["profile"],
  });

  const clearCallOrder = clearGuestDiagnosisMock.mock.invocationCallOrder[0];
  const diagnosisInvalidationOrder =
    mocks.invalidateQueries.mock.invocationCallOrder[0];
  const profileInvalidationOrder =
    mocks.invalidateQueries.mock.invocationCallOrder[1];
  const refreshCallOrder = mocks.refresh.mock.invocationCallOrder[0];

  expect(clearCallOrder).toBeLessThan(diagnosisInvalidationOrder);
  expect(diagnosisInvalidationOrder).toBeLessThan(profileInvalidationOrder);
  expect(profileInvalidationOrder).toBeLessThan(refreshCallOrder);
}

describe("useGuestDiagnosisMigration", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    clearGuestDiagnosisMock.mockReset();
    clearGuestDiagnosisMock.mockReturnValue({ status: "success" });
    migrateGuestDiagnosisMock.mockReset();
    migrateGuestDiagnosisMock.mockResolvedValue(CREATED_OUTCOME);
    readGuestDiagnosisMock.mockReset();
    readGuestDiagnosisMock.mockReturnValue({ status: "empty" });
    mocks.invalidateQueries.mockReset();
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.refresh.mockReset();

    resultRef = createRef<MigrationHookResult>();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("빈 캐시는 마이그레이션이나 삭제 없이 idle 상태가 된다", async () => {
    readGuestDiagnosisMock.mockReturnValue({ status: "empty" });

    await renderMigrationHook();

    expectState({ phase: "idle" });
    expect(migrateGuestDiagnosisMock).not.toHaveBeenCalled();
    expect(clearGuestDiagnosisMock).not.toHaveBeenCalled();
  });

  it.each(CACHE_ERROR_CASES)(
    "$label는 마이그레이션 없이 $reason 오류가 된다",
    async ({ readResult, reason }) => {
      readGuestDiagnosisMock.mockReturnValue(readResult);

      await renderMigrationHook();

      expectState({ phase: "error", reason });
      expect(migrateGuestDiagnosisMock).not.toHaveBeenCalled();
      expect(clearGuestDiagnosisMock).not.toHaveBeenCalled();
    }
  );

  it("StrictMode 이중 effect에서도 자동 마이그레이션을 한 번만 시작한다", async () => {
    readGuestDiagnosisMock.mockReturnValue({
      status: "ready",
      diagnosis: CACHED_DIAGNOSIS,
    });

    await act(async () => {
      root.render(
        <StrictMode>
          <MigrationHookHarness resultRef={resultRef} />
        </StrictMode>
      );
    });
    await flushAsyncWork();

    expectState({ phase: "complete", outcome: CREATED_OUTCOME });
    expect(readGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
  });

  it("손상 캐시 폐기는 캐시만 삭제하고 idle 상태로 전환한다", async () => {
    readGuestDiagnosisMock.mockReturnValue({ status: "invalid" });

    await renderMigrationHook();
    await runHookAction(getLatestResult().discardInvalidCache);

    expectState({ phase: "idle" });
    expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(migrateGuestDiagnosisMock).not.toHaveBeenCalled();
  });

  it("저장소 다시 읽기는 캐시가 확인된 뒤에만 마이그레이션을 시작한다", async () => {
    readGuestDiagnosisMock
      .mockReturnValueOnce({ status: "unavailable" })
      .mockReturnValueOnce({
        status: "ready",
        diagnosis: CACHED_DIAGNOSIS,
      });

    await renderMigrationHook();
    expect(migrateGuestDiagnosisMock).not.toHaveBeenCalled();

    await runHookAction(getLatestResult().retryRead);

    expectState({ phase: "complete", outcome: CREATED_OUTCOME });
    expect(readGuestDiagnosisMock).toHaveBeenCalledTimes(2);
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
  });

  it.each(MIGRATION_FAILURE_CASES)(
    "$label로 마이그레이션이 거부되면 캐시를 삭제하지 않고 migration-failed가 된다",
    async ({ error }) => {
      readGuestDiagnosisMock.mockReturnValue({
        status: "ready",
        diagnosis: CACHED_DIAGNOSIS,
      });
      migrateGuestDiagnosisMock.mockRejectedValue(error);

      await renderMigrationHook();

      expectState({ phase: "error", reason: "migration-failed" });
      expect(clearGuestDiagnosisMock).not.toHaveBeenCalled();
      expect(mocks.invalidateQueries).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    }
  );

  it("마이그레이션 실패 재시도는 유지된 캐시로 core 저장만 다시 시작한다", async () => {
    readGuestDiagnosisMock.mockReturnValue({
      status: "ready",
      diagnosis: CACHED_DIAGNOSIS,
    });
    migrateGuestDiagnosisMock
      .mockRejectedValueOnce(new Error("network failed"))
      .mockResolvedValueOnce(CREATED_OUTCOME);

    await renderMigrationHook();
    expectState({ phase: "error", reason: "migration-failed" });

    await runHookAction(getLatestResult().retryMigration);

    expectState({ phase: "complete", outcome: CREATED_OUTCOME });
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledTimes(2);
    expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();
  });

  it.each(SUCCESS_OUTCOMES)(
    "$label 결과는 캐시 삭제 후 두 쿼리를 무효화하고 새로고침한 뒤 완료된다",
    async ({ outcome }) => {
      readGuestDiagnosisMock.mockReturnValue({
        status: "ready",
        diagnosis: CACHED_DIAGNOSIS,
      });
      migrateGuestDiagnosisMock.mockResolvedValue(outcome);

      await renderMigrationHook();

      expectState({ phase: "complete", outcome });
      expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
      expect(migrateGuestDiagnosisMock).toHaveBeenCalledWith({
        answers: CACHED_DIAGNOSIS.answers,
      });
      expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();
      expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2);
      expect(mocks.refresh).toHaveBeenCalledOnce();
      expectRefreshSequence();
    }
  );

  it("캐시 삭제 실패 후 retryClear는 마이그레이션 없이 삭제부터 다시 수행한다", async () => {
    readGuestDiagnosisMock.mockReturnValue({
      status: "ready",
      diagnosis: CACHED_DIAGNOSIS,
    });
    clearGuestDiagnosisMock
      .mockReturnValueOnce({ status: "unavailable" })
      .mockReturnValueOnce({ status: "success" });

    await renderMigrationHook();

    expectState({
      phase: "error",
      reason: "clear-failed",
      outcome: CREATED_OUTCOME,
    });
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();

    await runHookAction(getLatestResult().retryClear);

    expectState({ phase: "complete", outcome: CREATED_OUTCOME });
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(clearGuestDiagnosisMock).toHaveBeenCalledTimes(2);
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("쿼리 무효화 실패 후 retryRefresh는 마이그레이션 없이 새로고침 단계만 다시 수행한다", async () => {
    readGuestDiagnosisMock.mockReturnValue({
      status: "ready",
      diagnosis: CACHED_DIAGNOSIS,
    });
    mocks.invalidateQueries.mockRejectedValueOnce(
      new Error("query invalidation failed")
    );

    await renderMigrationHook();

    expectState({
      phase: "error",
      reason: "refresh-failed",
      outcome: CREATED_OUTCOME,
    });
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mocks.refresh).not.toHaveBeenCalled();

    await runHookAction(getLatestResult().retryRefresh);

    expectState({ phase: "complete", outcome: CREATED_OUTCOME });
    expect(migrateGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(clearGuestDiagnosisMock).toHaveBeenCalledOnce();
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(4);
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: ["diagnosis"],
    });
    expect(mocks.invalidateQueries).toHaveBeenNthCalledWith(4, {
      queryKey: ["profile"],
    });
  });
});
