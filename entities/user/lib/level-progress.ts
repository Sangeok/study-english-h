import { LEVEL_PROGRESS, PROMOTION, getNextLevel } from "@/shared/constants";

export interface LevelProgressInput {
  /** 현재 레벨 단어들의 성숙 점수 합 (MASTERY_SCORE 가중) */
  maturityScoreSum: number;
  /** 현재 레벨 최근 시도 수 (ACCURACY_WINDOW 창 내) */
  recentAttemptCount: number;
  recentCorrectCount: number;
  /** 복습 도래 단어 수 (레벨 무관 전체 — 부채는 전체 학습 상태의 주장) */
  reviewDebt: number;
}

export function calculateLevelProgress(input: LevelProgressInput): number {
  const { maturityScoreSum, recentAttemptCount, recentCorrectCount, reviewDebt } = input;

  // A — 성숙도 (가중 MATURITY_WEIGHT)
  const maturity =
    Math.min(maturityScoreSum / LEVEL_PROGRESS.TARGET_WORD_UNITS, 1) * 100;

  // B — 최근 정답률 점수 (가중 ACCURACY_WEIGHT), 볼륨 비례 감쇠.
  //   변수명이 ACCURACY_WEIGHT 와 정렬되도록: correctRate 는 원정답률, accuracyScore 가 가중 대상.
  //   (시간 recency 가 아니라 정답률 점수다 — 최근성은 상위 쿼리 take:ACCURACY_WINDOW 가 이미 처리)
  const correctRate =
    recentAttemptCount > 0 ? (recentCorrectCount / recentAttemptCount) * 100 : 0;
  const volumeFactor = Math.min(recentAttemptCount / LEVEL_PROGRESS.ACCURACY_MIN_VOLUME, 1);
  const accuracyScore =
    Math.min(correctRate / LEVEL_PROGRESS.ACCURACY_FULL_MARK, 1) * 100 * volumeFactor;

  // D — 복습 부채 페널티
  const debtPenalty = Math.min(reviewDebt, LEVEL_PROGRESS.MAX_REVIEW_DEBT_PENALTY);

  const weighted = Math.round(
    LEVEL_PROGRESS.MATURITY_WEIGHT * maturity + LEVEL_PROGRESS.ACCURACY_WEIGHT * accuracyScore
  );
  return Math.max(0, Math.min(100, weighted - debtPenalty));
}

export type PromotionStatus = "locked" | "eligible" | "cooldown" | "max-level";

/** derivePromotionStatus 반환 — availableAt 은 cooldown 일 때만 존재한다.
 *  불가능 조합({status:"eligible", availableAt:Date} 등)을 타입으로 차단하는 판별 유니온. */
export type PromotionState =
  | { status: "cooldown"; availableAt: Date }
  | { status: "locked" | "eligible" | "max-level"; availableAt: null };

/** 재응시 가능 여부 — availableAt 은 불가일 때만 존재한다(판별 유니온으로 불가능 조합 차단). */
export type RetryAvailability =
  | { canRetry: true; availableAt: null }
  | { canRetry: false; availableAt: Date };

/** 쿨다운 단독 술어 — 진행률에 의존하지 않는다.
 *  submit 라우트는 진행률을 계산하지 않으므로(§4-2) 이 술어만 호출한다.
 *  derivePromotionStatus 도 같은 함수를 쓰므로 "+3일" 규칙의 출처는 여기 하나다. */
export function calculateRetryAvailability(
  lastFailedAt: Date | null,
  now: Date = new Date()
): RetryAvailability {
  if (!lastFailedAt) return { canRetry: true, availableAt: null };

  const availableAt = new Date(
    lastFailedAt.getTime() + PROMOTION.RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  );
  return now < availableAt
    ? { canRetry: false, availableAt }
    : { canRetry: true, availableAt: null };
}

export function derivePromotionStatus(
  level: string,
  progress: number,
  lastFailedAt: Date | null,
  now: Date = new Date()
): PromotionState {
  // 최상위 레벨은 getNextLevel 로 판정 — 리터럴 "C2" 대신 단일 출처(CEFR_ORDER 확장 시 자동 대응).
  //   비정규 문자열도 getNextLevel 이 null 을 주므로 max-level(=승급 불가)로 안전 처리된다.
  if (getNextLevel(level) === null) return { status: "max-level", availableAt: null };

  // 쿨다운을 진행률보다 먼저 본다 — 실패 직후엔 편입 단어가 아직 도래 전이라 100 이 유지될 수 있다
  const retry = calculateRetryAvailability(lastFailedAt, now);
  if (!retry.canRetry) return { status: "cooldown", availableAt: retry.availableAt };

  if (progress >= 100) return { status: "eligible", availableAt: null };
  return { status: "locked", availableAt: null };
}
