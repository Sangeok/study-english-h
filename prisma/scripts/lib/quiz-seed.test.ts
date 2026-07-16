// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { QuizQuestionSource } from "@/entities/question/lib/quiz-source-schema";
import packageJson from "../../../package.json";
import { resolveQuizSeedMode, seedQuizQuestions } from "./quiz-seed";

const question: QuizQuestionSource = {
  koreanHint: "사과",
  contextHintKo: "과일을 고르는 상황",
  englishWord: "apple",
  sentence: "I ate an ___ after lunch.",
  difficulty: "A1",
  category: "daily",
  options: [
    { text: "apple", isCorrect: true, order: 1 },
    { text: "table", isCorrect: false, order: 2 },
    { text: "paper", isCorrect: false, order: 3 },
    { text: "water", isCorrect: false, order: 4 },
  ],
};

describe("resolveQuizSeedMode", () => {
  it("should use non-destructive upsert mode when reset flag is absent", () => {
    expect(resolveQuizSeedMode([])).toBe("upsert");
    expect(resolveQuizSeedMode(["SEED_RESET=1"])).toBe("upsert");
  });

  it("should use reset mode only when the reset CLI flag is present", () => {
    expect(resolveQuizSeedMode(["--reset"])).toBe("reset");
  });
});

describe("content seed package scripts", () => {
  it("should expose the four official commands without reset in the aggregate", () => {
    expect(packageJson.scripts).toMatchObject({
      "content:seed:vocabulary": "tsx prisma/seed-vocabulary.ts",
      "content:seed:quiz": "tsx prisma/seed-quiz.ts",
      "content:seed:quiz:reset": "tsx prisma/seed-quiz.ts --reset",
      "content:seed":
        "npm run content:check && npm run content:seed:vocabulary && npm run content:seed:quiz",
    });
    expect(packageJson.scripts["content:seed"]).not.toContain("reset");
  });
});

describe("seedQuizQuestions", () => {
  it("should not delete existing questions in the default upsert mode", async () => {
    const deleteExisting = vi.fn();
    const upsert = vi.fn().mockResolvedValue(undefined);

    const seededCount = await seedQuizQuestions({
      questions: [question],
      mode: "upsert",
      operations: { deleteExisting, upsert },
    });

    expect(deleteExisting).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledOnce();
    expect(upsert).toHaveBeenCalledWith(question);
    expect(seededCount).toBe(1);
  });

  it("should delete existing questions once before upserting in reset mode", async () => {
    const calls: string[] = [];
    const deleteExisting = vi.fn(async () => {
      calls.push("delete");
    });
    const upsert = vi.fn(async () => {
      calls.push("upsert");
    });

    await seedQuizQuestions({
      questions: [question],
      mode: "reset",
      operations: { deleteExisting, upsert },
    });

    expect(deleteExisting).toHaveBeenCalledOnce();
    expect(calls).toEqual(["delete", "upsert"]);
  });

  it("should propagate an upsert error and stop processing later questions", async () => {
    const upsertError = new Error("upsert failed");
    const upsert = vi.fn().mockRejectedValue(upsertError);

    const result = seedQuizQuestions({
      questions: [question, { ...question, englishWord: "banana" }],
      mode: "upsert",
      operations: { deleteExisting: vi.fn(), upsert },
    });

    await expect(result).rejects.toBe(upsertError);
    expect(upsert).toHaveBeenCalledOnce();
  });
});
