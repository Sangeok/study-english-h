import type { QuizQuestionSource } from "@/entities/question/lib/quiz-source-schema";

export type QuizSeedMode = "upsert" | "reset";

export interface QuizSeedOperations {
  deleteExisting: () => Promise<unknown>;
  upsert: (question: QuizQuestionSource) => Promise<unknown>;
}

interface SeedQuizQuestionsOptions {
  questions: readonly QuizQuestionSource[];
  mode: QuizSeedMode;
  operations: QuizSeedOperations;
  /** 진행 로그용. 배치가 끝날 때마다 호출된다. */
  onProgress?: (processed: number, total: number) => void;
}

/**
 * 한 번에 던지는 upsert 수.
 *
 * 원격 DB 왕복이 200ms 안팎이고 문항당 중첩 쓰기(options deleteMany+create)가 있어
 * 순차 처리하면 887문항이 9분을 넘는다. 어휘 시드가 같은 이유로 5분 트랜잭션 제한에
 * 걸려 전량 롤백됐다.
 */
export const QUIZ_SEED_CONCURRENCY = 10;

export function resolveQuizSeedMode(args: readonly string[]): QuizSeedMode {
  return args.includes("--reset") ? "reset" : "upsert";
}

/**
 * 문항을 배치로 나눠 적재한다.
 *
 * 실패 시 **그 배치까지만** 진행하고 첫 오류를 그대로 던진다. 순차 처리 때의
 * "실패 직후 즉시 중단"보다 약한 보장이다 — 같은 배치에 이미 던져진 요청은 끝까지 간다.
 * upsert 가 (difficulty, englishWord) 기준 멱등이라 재실행하면 이어지므로 감수한다.
 */
export async function seedQuizQuestions({
  questions,
  mode,
  operations,
  onProgress,
}: SeedQuizQuestionsOptions): Promise<number> {
  if (mode === "reset") {
    await operations.deleteExisting();
  }

  for (let offset = 0; offset < questions.length; offset += QUIZ_SEED_CONCURRENCY) {
    const batch = questions.slice(offset, offset + QUIZ_SEED_CONCURRENCY);

    // allSettled 로 받아야 나머지 거부가 unhandled 로 새지 않는다. 첫 오류만 올린다.
    const results = await Promise.allSettled(batch.map((question) => operations.upsert(question)));
    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      throw failure.reason;
    }

    onProgress?.(offset + batch.length, questions.length);
  }

  return questions.length;
}
