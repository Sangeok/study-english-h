/**
 * CHECK 제약조건 위반 에러 판별 헬퍼
 *
 * @prisma/adapter-pg 패턴에서는 PostgreSQL 에러가 Prisma 표준 에러 코드로
 * 래핑되지 않을 수 있으므로, P2004(Prisma)와 23514(PostgreSQL)를 모두 확인한다.
 * 구현 시 의도적으로 CHECK 위반을 발생시켜 실제 에러 구조를 확인할 것.
 */

// (RV2) v2 신규 제약조건 포함 배열로 일반화
const NON_NEGATIVE_CONSTRAINTS = [
  "spendableXP_non_negative",
  "xpBoostCharges_non_negative", // v2 신규
  "freeHintCount_non_negative",  // v2 신규
] as const;

export function isPrismaCheckConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const err = error as Record<string, unknown>;

  // 표준 Prisma constraint failed 에러
  if (err.code === "P2004") return true;

  // PostgreSQL check_violation (adapter-pg 직접 전달)
  if (err.code === "23514") return true;

  // adapter-pg가 cause에 원본 에러를 넣는 경우
  if (
    typeof err.cause === "object" &&
    err.cause !== null &&
    (err.cause as Record<string, unknown>).code === "23514"
  ) {
    return true;
  }

  // 메시지 기반 fallback — 제약명 배열로 일반화 (v2 신규 제약 포함)
  if (typeof err.message === "string") {
    const msg = err.message;
    if (
      msg.toLowerCase().includes("check constraint") &&
      NON_NEGATIVE_CONSTRAINTS.some((name) => msg.includes(name))
    ) {
      return true;
    }
  }

  return false;
}
