class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** 파싱된 오류 응답 body. 같은 status 안에서 `reason` 으로 화면이 갈리는 계약
     *  (승급 403/409)에 필요하다. 3번째 인자가 선택적이라 `new ApiError(409, "…")` 인
     *  기존 소비자·테스트는 그대로 컴파일된다. */
    public body?: unknown
  ) {
    super(message);
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.error ?? `요청 실패 (${response.status})`,
      body
    );
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { cache: "no-store" }),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }),
};

export { ApiError };
