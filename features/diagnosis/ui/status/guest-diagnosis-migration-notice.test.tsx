import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useGuestDiagnosisMigration,
  type GuestDiagnosisMigrationState,
} from "../../model/use-guest-diagnosis-migration";
import { GuestDiagnosisMigrationNotice } from "./guest-diagnosis-migration-notice";

const mocks = vi.hoisted(() => ({
  useGuestDiagnosisMigration: vi.fn(),
  retryRead: vi.fn(),
  discardInvalidCache: vi.fn(),
  retryMigration: vi.fn(),
  retryClear: vi.fn(),
  retryRefresh: vi.fn(),
}));

vi.mock("../../model/use-guest-diagnosis-migration", () => ({
  useGuestDiagnosisMigration: mocks.useGuestDiagnosisMigration,
}));

const CREATED_OUTCOME = {
  outcome: "created",
  diagnosisId: "diagnosis-new",
} as const;

const ALREADY_COMPLETED_OUTCOME = {
  outcome: "already-completed",
} as const;

const BLOCKING_STATES = [
  { label: "checking", state: { phase: "checking" } },
  { label: "migrating", state: { phase: "migrating" } },
  {
    label: "clearing",
    state: { phase: "clearing", outcome: CREATED_OUTCOME },
  },
  {
    label: "refreshing",
    state: { phase: "refreshing", outcome: CREATED_OUTCOME },
  },
  {
    label: "invalid-cache 오류",
    state: { phase: "error", reason: "invalid-cache" },
  },
  {
    label: "storage-unavailable 오류",
    state: { phase: "error", reason: "storage-unavailable" },
  },
  {
    label: "migration-failed 오류",
    state: { phase: "error", reason: "migration-failed" },
  },
  {
    label: "clear-failed 오류",
    state: {
      phase: "error",
      reason: "clear-failed",
      outcome: CREATED_OUTCOME,
    },
  },
  {
    label: "refresh-failed 오류",
    state: {
      phase: "error",
      reason: "refresh-failed",
      outcome: CREATED_OUTCOME,
    },
  },
] satisfies ReadonlyArray<{
  label: string;
  state: GuestDiagnosisMigrationState;
}>;

const RECOVERY_ACTION_NAMES = [
  "discardInvalidCache",
  "retryRead",
  "retryMigration",
  "retryClear",
  "retryRefresh",
] as const;

type RecoveryActionName = (typeof RECOVERY_ACTION_NAMES)[number];

const ERROR_CASES = [
  {
    label: "invalid-cache",
    state: { phase: "error", reason: "invalid-cache" },
    title: "임시 진단 결과가 손상됐어요",
    buttonLabel: "임시 결과 삭제하고 홈 계속",
    actionName: "discardInvalidCache",
  },
  {
    label: "storage-unavailable",
    state: { phase: "error", reason: "storage-unavailable" },
    title: "임시 진단 결과를 확인하지 못했어요",
    buttonLabel: "다시 확인",
    actionName: "retryRead",
  },
  {
    label: "migration-failed",
    state: { phase: "error", reason: "migration-failed" },
    title: "진단 결과를 계정에 저장하지 못했어요",
    buttonLabel: "결과 다시 저장",
    actionName: "retryMigration",
  },
  {
    label: "clear-failed",
    state: {
      phase: "error",
      reason: "clear-failed",
      outcome: CREATED_OUTCOME,
    },
    title: "계정 저장은 완료됐지만 임시 결과를 정리하지 못했어요",
    buttonLabel: "임시 결과 다시 정리",
    actionName: "retryClear",
  },
  {
    label: "refresh-failed",
    state: {
      phase: "error",
      reason: "refresh-failed",
      outcome: CREATED_OUTCOME,
    },
    title: "계정 저장은 완료됐지만 화면을 업데이트하지 못했어요",
    buttonLabel: "화면 새로고침",
    actionName: "retryRefresh",
  },
] satisfies ReadonlyArray<{
  label: string;
  state: GuestDiagnosisMigrationState;
  title: string;
  buttonLabel: string;
  actionName: RecoveryActionName;
}>;

const useGuestDiagnosisMigrationMock = vi.mocked(
  useGuestDiagnosisMigration
);

let container: HTMLDivElement;
let root: Root;

function setMigrationState(state: GuestDiagnosisMigrationState): void {
  useGuestDiagnosisMigrationMock.mockReturnValue({
    state,
    retryRead: mocks.retryRead,
    discardInvalidCache: mocks.discardInvalidCache,
    retryMigration: mocks.retryMigration,
    retryClear: mocks.retryClear,
    retryRefresh: mocks.retryRefresh,
  });
}

async function renderNotice(state: GuestDiagnosisMigrationState): Promise<void> {
  setMigrationState(state);

  await act(async () => {
    root.render(
      <GuestDiagnosisMigrationNotice isAuthenticated>
        <div data-testid="home-content">홈 콘텐츠</div>
      </GuestDiagnosisMigrationNotice>
    );
  });
}

function hasHomeContent(): boolean {
  return container.querySelector('[data-testid="home-content"]') !== null;
}

function findButtonByLabel(label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`버튼을 찾을 수 없습니다: ${label}`);
  }

  return button;
}

describe("GuestDiagnosisMigrationNotice", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.clearAllMocks();

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

  it.each(BLOCKING_STATES)(
    "$label 상태에서는 홈 콘텐츠를 마운트하지 않는다",
    async ({ state }) => {
      await renderNotice(state);

      expect(hasHomeContent()).toBe(false);
    }
  );

  it("idle 상태에서는 홈 콘텐츠를 마운트한다", async () => {
    await renderNotice({ phase: "idle" });

    expect(hasHomeContent()).toBe(true);
    expect(useGuestDiagnosisMigrationMock).toHaveBeenCalledWith(true);
  });

  it("created 완료 상태는 신규 저장 문구와 홈 콘텐츠를 표시한다", async () => {
    await renderNotice({ phase: "complete", outcome: CREATED_OUTCOME });

    expect(hasHomeContent()).toBe(true);
    expect(container.textContent).toContain(
      "진단 결과가 계정에 저장됐어요. 딱 맞는 레벨에서 시작해요!"
    );
    expect(container.textContent).not.toContain(
      "기존 진단 기록을 유지하고 임시 결과를 정리했어요."
    );
  });

  it("already-completed 완료 상태는 기존 기록 유지 문구와 홈 콘텐츠를 표시한다", async () => {
    await renderNotice({
      phase: "complete",
      outcome: ALREADY_COMPLETED_OUTCOME,
    });

    expect(hasHomeContent()).toBe(true);
    expect(container.textContent).toContain(
      "기존 진단 기록을 유지하고 임시 결과를 정리했어요."
    );
    expect(container.textContent).not.toContain(
      "진단 결과가 계정에 저장됐어요. 딱 맞는 레벨에서 시작해요!"
    );
  });

  it.each(ERROR_CASES)(
    "$label 오류는 정확한 복구 버튼으로 해당 action만 호출한다",
    async ({ state, title, buttonLabel, actionName }) => {
      await renderNotice(state);

      expect(container.textContent).toContain(title);

      await act(async () => {
        findButtonByLabel(buttonLabel).click();
      });

      expect(mocks[actionName]).toHaveBeenCalledOnce();
      for (const otherActionName of RECOVERY_ACTION_NAMES) {
        if (otherActionName === actionName) continue;
        expect(mocks[otherActionName]).not.toHaveBeenCalled();
      }
    }
  );
});
