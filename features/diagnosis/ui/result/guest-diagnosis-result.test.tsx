import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DiagnosisResult } from "../../types";
import {
  GuestDiagnosisResult,
  type GuestDiagnosisCacheState,
} from "./guest-diagnosis-result";

const mocks = vi.hoisted(() => ({
  getSearchParam: vi.fn(),
  signInSocial: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mocks.getSearchParam }),
}));

vi.mock("@/shared/lib/client", () => ({
  signIn: { social: mocks.signInSocial },
}));

const RESULT: DiagnosisResult = {
  totalScore: 75,
  cefrLevel: "B2",
  weaknessAreas: [{ category: "grammar", accuracy: 55 }],
  recommendedStartPoint: "B2-unit-1",
};

const KAKAO_BUTTON_LABEL = "카카오로 계속하고 결과 저장";
const START_FAILURE_MESSAGE =
  "카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.";

let container: HTMLDivElement;
let root: Root;

async function renderResult({
  cacheState,
}: {
  cacheState: GuestDiagnosisCacheState;
}): Promise<void> {
  await act(async () => {
    root.render(
      <GuestDiagnosisResult
        result={RESULT}
        cacheState={cacheState}
      />
    );
  });
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

function queryButtonByLabel(label: string): HTMLButtonElement | null {
  return (
    Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.trim() === label
    ) ?? null
  );
}

async function clickButton(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.click();
    await Promise.resolve();
  });
}

describe("GuestDiagnosisResult", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.clearAllMocks();
    mocks.getSearchParam.mockReturnValue(null);
    mocks.signInSocial.mockResolvedValue({ data: null, error: null });

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

  it("cache saving 상태에서는 OAuth 버튼을 노출하거나 로그인을 시작하지 않는다", async () => {
    await renderResult({ cacheState: { status: "saving" } });

    expect(container.textContent).toContain("진단 결과를 안전하게 보관하고 있어요.");
    expect(queryButtonByLabel(KAKAO_BUTTON_LABEL)).toBeNull();
    expect(mocks.signInSocial).not.toHaveBeenCalled();
  });

  it("cache error 상태에서는 저장 재시도만 허용하고 로그인을 시작하지 않는다", async () => {
    const onRetryCacheSave = vi.fn();
    await renderResult({
      cacheState: { status: "error", onRetryCacheSave },
    });

    expect(queryButtonByLabel(KAKAO_BUTTON_LABEL)).toBeNull();

    await clickButton(findButtonByLabel("결과 다시 저장"));

    expect(onRetryCacheSave).toHaveBeenCalledOnce();
    expect(mocks.signInSocial).not.toHaveBeenCalled();
  });

  it("cache ready 상태의 OAuth 요청에 성공 및 오류 복귀 URL을 전달한다", async () => {
    await renderResult({ cacheState: { status: "ready" } });

    await clickButton(findButtonByLabel(KAKAO_BUTTON_LABEL));

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      provider: "kakao",
      callbackURL: "/",
      errorCallbackURL: "/diagnosis?oauth=cancelled",
    });
  });

  it("OAuth 요청이 error 결과를 반환하면 시작 실패 문구를 표시한다", async () => {
    mocks.signInSocial.mockResolvedValue({
      data: null,
      error: { message: "sign-in failed" },
    });
    await renderResult({ cacheState: { status: "ready" } });

    await clickButton(findButtonByLabel(KAKAO_BUTTON_LABEL));

    expect(container.textContent).toContain(START_FAILURE_MESSAGE);
  });

  it("OAuth 요청이 예외를 던지면 시작 실패 문구를 표시한다", async () => {
    mocks.signInSocial.mockRejectedValue(new Error("network unavailable"));
    await renderResult({ cacheState: { status: "ready" } });

    await clickButton(findButtonByLabel(KAKAO_BUTTON_LABEL));

    expect(container.textContent).toContain(START_FAILURE_MESSAGE);
  });

  it("OAuth 요청이 pending인 동안 버튼을 비활성화하고 중복 요청을 막는다", async () => {
    type SignInResponse = { data: null; error: null };
    let resolveSignIn: (response: SignInResponse) => void = () => undefined;
    const pendingSignIn = new Promise<SignInResponse>((resolve) => {
      resolveSignIn = resolve;
    });
    mocks.signInSocial.mockReturnValue(pendingSignIn);
    await renderResult({ cacheState: { status: "ready" } });
    const kakaoButton = findButtonByLabel(KAKAO_BUTTON_LABEL);

    await clickButton(kakaoButton);

    expect(kakaoButton.disabled).toBe(true);
    kakaoButton.click();
    expect(mocks.signInSocial).toHaveBeenCalledOnce();

    await act(async () => {
      resolveSignIn({ data: null, error: null });
      await pendingSignIn;
    });
  });

  it("oauth=cancelled 복귀는 취소로 단정하지 않는 중립 문구를 표시한다", async () => {
    mocks.getSearchParam.mockImplementation((key: string) => {
      if (key === "oauth") return "cancelled";
      return null;
    });

    await renderResult({ cacheState: { status: "ready" } });

    expect(container.textContent).toContain(
      "카카오 로그인이 완료되지 않았어요. 진단 결과는 이 탭에 그대로 남아 있어요."
    );
    expect(container.textContent).not.toContain("취소");
    expect(mocks.signInSocial).not.toHaveBeenCalled();
  });
});
