import { ApiError } from "@/shared/lib";
import { readErrorAvailableAt, readErrorReason } from "../api/promotion-api";

/**
 * 화면이 갈라지는 단위 — status 만으로는 403 세 갈래·409 세 갈래를 구분할 수 없다.
 * 서버 계약(§4-5)의 `reason` 판별자를 화면 상태로 옮기는 것이 이 모듈의 유일한 일이다.
 */
export type PromotionFailure =
  | { kind: "locked" }
  | { kind: "cooldown"; availableAt: string | null }
  | { kind: "max-level" }
  | { kind: "content-unavailable" }
  | { kind: "session-invalid" }
  | { kind: "level-changed" }
  | { kind: "unknown" };

/**
 * 오류를 삼키지 않는다 — 제출이 조용히 사라지는 화면이 없어야 한다.
 * 판별에 실패하면 unknown 으로 떨어뜨려 일반 오류 화면을 보여준다(빈 화면 금지).
 */
export function toPromotionFailure(error: unknown): PromotionFailure {
  const status = error instanceof ApiError ? error.status : null;
  const reason = readErrorReason(error);

  if (status === 403) {
    if (reason === "cooldown") {
      return { kind: "cooldown", availableAt: readErrorAvailableAt(error) };
    }
    if (reason === "max-level") return { kind: "max-level" };
    // reason 이 없거나 모르는 값이면 가장 흔한 미자격으로 안내한다.
    return { kind: "locked" };
  }

  if (status === 503) return { kind: "content-unavailable" };

  if (status === 409) {
    if (reason === "cooldown") {
      return { kind: "cooldown", availableAt: readErrorAvailableAt(error) };
    }
    if (reason === "level-changed") return { kind: "level-changed" };
    if (reason === "session-invalid") return { kind: "session-invalid" };
  }

  return { kind: "unknown" };
}

/**
 * 새 세션을 받아 다시 응시할 수 있는 실패인가 — "다시 시작" 버튼의 표시 조건.
 * 이 두 경우는 가드 단계에서 트랜잭션이 롤백돼 응시 기록이 남지 않는다.
 * 즉 쿨다운을 소모하지 않으므로, 카피가 "기회를 썼다"고 오해시키면 안 된다(§4-5).
 */
export function isRestartableFailure(failure: PromotionFailure): boolean {
  return failure.kind === "session-invalid" || failure.kind === "level-changed";
}
