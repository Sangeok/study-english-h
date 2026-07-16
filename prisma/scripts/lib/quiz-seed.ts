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
}

export function resolveQuizSeedMode(args: readonly string[]): QuizSeedMode {
  return args.includes("--reset") ? "reset" : "upsert";
}

export async function seedQuizQuestions({
  questions,
  mode,
  operations,
}: SeedQuizQuestionsOptions): Promise<number> {
  if (mode === "reset") {
    await operations.deleteExisting();
  }

  for (const question of questions) {
    await operations.upsert(question);
  }

  return questions.length;
}
