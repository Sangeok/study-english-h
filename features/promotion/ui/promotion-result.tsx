"use client";

import { Confetti, tactileButtonClass } from "@/shared/ui";
import { PROMOTION } from "@/shared/constants";
import type { PromotionSubmitResponse } from "../api/promotion-api";

interface PromotionResultProps {
  result: PromotionSubmitResponse;
  onGoHome: () => void;
}

export function PromotionResult({ result, onGoHome }: PromotionResultProps) {
  // 틀린 개수는 correctCount 에서 파생한다 — enrolledCount 는 matched-and-committed 수라
  // 미연결 단어가 탈락하면 틀린 수보다 작을 수 있다(P1 계약).
  const wrongCount = PROMOTION.QUESTION_COUNT - result.correctCount;

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      {result.passed && <Confetti />}

      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ink-soft">
        {result.passed ? "Promoted" : "Result"}
      </p>

      <h1 className="mt-3 font-display text-4xl font-extrabold text-ink">
        {result.passed ? `${result.newLevel} 로 올라갔어요` : "이번엔 아쉬웠어요"}
      </h1>

      <p className="mt-4 text-ink-soft">
        {PROMOTION.QUESTION_COUNT}문항 중{" "}
        <span className="font-display font-bold tabular-nums text-ink">
          {result.correctCount}
        </span>
        문항을 맞혔어요
        {result.passed ? "." : ` (통과 기준 ${PROMOTION.PASS_COUNT}문항).`}
      </p>

      {!result.passed && (
        <p className="mt-3 text-sm text-ink-soft">
          {result.enrolledCount !== null && result.enrolledCount > 0
            ? `틀린 ${wrongCount}개 중 ${result.enrolledCount}개를 복습 목록에 담았어요. 복습하면 준비도가 회복돼요.`
            : "틀린 단어는 복습으로 다시 만나요."}
          <br />
          재응시는 {PROMOTION.RETRY_COOLDOWN_DAYS}일 뒤에 가능해요.
        </p>
      )}

      <button
        onClick={onGoHome}
        className={tactileButtonClass("teal", "lg", { className: "mt-8" })}
      >
        홈으로
      </button>
    </div>
  );
}
