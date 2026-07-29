"use client";

import { useRouter } from "next/navigation";
import { FullPageSpinner, tactileButtonClass } from "@/shared/ui";
import { PROMOTION, ROUTES } from "@/shared/constants";
import { usePromotionTest } from "../model/use-promotion-test";
import { isRestartableFailure, promotionFailureCopy } from "../lib/promotion-failure";
import { PromotionResult } from "./promotion-result";

export function PromotionTest() {
  const router = useRouter();
  const { phase, failure, toLevel, questions, answers, result, answer, submit, restart } =
    usePromotionTest();

  if (phase === "loading") {
    return <FullPageSpinner message="시험을 준비하고 있어요..." />;
  }

  if (phase === "failed" && failure) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">승급 시험</h1>
        <p className="mt-3 text-ink-soft">{promotionFailureCopy(failure)}</p>
        <div className="mt-8 flex justify-center gap-3">
          {isRestartableFailure(failure) && (
            <button onClick={restart} className={tactileButtonClass("gold", "lg")}>
              다시 시작
            </button>
          )}
          <button
            onClick={() => router.push(ROUTES.HOME)}
            className={tactileButtonClass("teal", "lg")}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done" && result) {
    return <PromotionResult result={result} onGoHome={() => router.push(ROUTES.HOME)} />;
  }

  const answeredIds = new Set(answers.map((item) => item.questionId));
  const allAnswered = answers.length === PROMOTION.QUESTION_COUNT;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ink-soft">
          Promotion Test
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">
          {toLevel} 승급 시험
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {PROMOTION.QUESTION_COUNT}문항 중 {PROMOTION.PASS_COUNT}문항을 맞히면 승급해요. 힌트는
          없어요.
        </p>
        <p className="mt-1 text-sm tabular-nums text-ink-soft">
          {answers.length} / {PROMOTION.QUESTION_COUNT} 응답
        </p>
      </header>

      <ol className="space-y-8">
        {questions.map((question, index) => {
          const selected = answers.find((item) => item.questionId === question.id);

          return (
            <li key={question.id} className="tactile-card p-6">
              <p className="text-xs font-semibold tabular-nums text-ink-soft">
                {index + 1} / {PROMOTION.QUESTION_COUNT}
              </p>
              <p className="mt-2 font-display text-lg font-bold text-ink">
                {question.koreanHint}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{question.sentence}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => (
                  <button
                    key={option.text}
                    onClick={() => answer(question.id, option.text)}
                    aria-pressed={selected?.selectedText === option.text}
                    className={tactileButtonClass(
                      selected?.selectedText === option.text ? "teal" : "ghost",
                      "md",
                      { block: true }
                    )}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex justify-center">
        <button
          onClick={submit}
          disabled={!allAnswered || phase === "submitting"}
          className={tactileButtonClass("gold", "lg", {
            className: !allAnswered || phase === "submitting" ? "opacity-50" : "",
          })}
        >
          {phase === "submitting"
            ? "채점 중..."
            : allAnswered
              ? "제출하기"
              : `${PROMOTION.QUESTION_COUNT - answeredIds.size}문항 남았어요`}
        </button>
      </div>
    </div>
  );
}
