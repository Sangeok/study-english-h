/**
 * 표준 API 응답 타입
 *
 * 모든 API 라우트는 이 타입을 따라야 합니다.
 */

// 성공 응답
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    timestamp?: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

// 에러 응답
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 응답 타입 (성공 또는 에러)
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 타입 가드
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as ApiErrorResponse).error === "object" &&
    "code" in (response as ApiErrorResponse).error &&
    "message" in (response as ApiErrorResponse).error
  );
}

// 응답 헬퍼 함수
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"]
): ApiSuccessResponse<T> {
  if (meta) {
    return { data, meta };
  }
  return { data };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  if (details) {
    return {
      error: {
        code,
        message,
        details,
      },
    };
  }
  return {
    error: {
      code,
      message,
    },
  };
}
