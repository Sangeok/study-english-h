import { ApiError, apiClient } from "@/shared/lib";

export interface PromotionQuestion {
  id: string;
  koreanHint: string;
  sentence: string;
  options: { text: string }[];
}

export interface PromotionStartResponse {
  sessionId: string;
  toLevel: string;
  questions: PromotionQuestion[];
}

export type PromotionSubmitResponse =
  | { passed: true; correctCount: number; newLevel: string }
  | { passed: false; correctCount: number; enrolledCount: number | null };

export interface PromotionAnswer {
  questionId: string;
  selectedText: string;
}

/**
 * 오류 응답의 `reason` 판별자 — 같은 status 안에서 화면이 갈린다(403 세 갈래·409 세 갈래).
 * `ApiError.body` 보존(shared/lib/api-client.ts)이 선행되어야 값이 들어온다.
 * 좁히기에 실패하면 null 을 돌려 일반 오류 화면으로 안전하게 떨어진다.
 */
export function readErrorReason(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  if (typeof body !== "object" || body === null) return null;
  const reason = (body as { reason?: unknown }).reason;
  return typeof reason === "string" ? reason : null;
}

/** cooldown 안내의 D-n 계산에 필요한 ISO — 없으면 null */
export function readErrorAvailableAt(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  if (typeof body !== "object" || body === null) return null;
  const availableAt = (body as { availableAt?: unknown }).availableAt;
  return typeof availableAt === "string" ? availableAt : null;
}

/** 세션을 만드는 쓰기라 POST. body 는 읽히지 않지만 apiClient.post 의 2번째 인자가 필수다. */
export function startPromotionTest(): Promise<PromotionStartResponse> {
  return apiClient.post<PromotionStartResponse>("/api/promotion/start", {});
}

export function submitPromotionTest(
  sessionId: string,
  answers: PromotionAnswer[]
): Promise<PromotionSubmitResponse> {
  return apiClient.post<PromotionSubmitResponse>("/api/promotion/submit", {
    sessionId,
    answers,
  });
}
