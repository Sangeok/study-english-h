import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import type { QuizQuestionSource } from "@/entities/question/lib/quiz-source-schema";
import { PrismaClient } from "../lib/generated/prisma/client";
import { loadArtifact, QUIZ_ARTIFACT } from "./scripts/lib/load-artifact";
import { resolveQuizSeedMode, seedQuizQuestions } from "./scripts/lib/quiz-seed";

const SEED_TRANSACTION_TIMEOUT_MS = 5 * 60 * 1_000;

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  console.log("🌱 퀴즈 데이터 시드 시작...\n");

  const root = path.resolve(fileURLToPath(import.meta.url), "../..");
  const quizQuestions = loadArtifact<QuizQuestionSource>(root, QUIZ_ARTIFACT);
  const mode = resolveQuizSeedMode(process.argv.slice(2));
  console.log(`📦 generated artifact 로드: ${quizQuestions.length}개 (${QUIZ_ARTIFACT.relPath})`);
  console.log(`🧭 실행 모드: ${mode === "reset" ? "전체 reset 후 적재" : "비파괴 upsert"}\n`);

  const prisma = createPrismaClient();

  try {
    const seededCount = await prisma.$transaction(
      async (transaction) =>
        seedQuizQuestions({
          questions: quizQuestions,
          mode,
          operations: {
            deleteExisting: () => transaction.quizQuestion.deleteMany({}),
            upsert: (question) =>
              transaction.quizQuestion.upsert({
                where: {
                  difficulty_englishWord: {
                    difficulty: question.difficulty,
                    englishWord: question.englishWord,
                  },
                },
                update: {
                  koreanHint: question.koreanHint,
                  contextHintKo: question.contextHintKo,
                  sentence: question.sentence,
                  category: question.category,
                  options: {
                    deleteMany: {},
                    create: question.options,
                  },
                },
                create: {
                  koreanHint: question.koreanHint,
                  contextHintKo: question.contextHintKo,
                  englishWord: question.englishWord,
                  sentence: question.sentence,
                  difficulty: question.difficulty,
                  category: question.category,
                  options: {
                    create: question.options,
                  },
                },
              }),
          },
        }),
      { timeout: SEED_TRANSACTION_TIMEOUT_MS }
    );

    const [totalCount, byDifficulty, byCategory] = await Promise.all([
      prisma.quizQuestion.count(),
      prisma.quizQuestion.groupBy({ by: ["difficulty"], _count: true }),
      prisma.quizQuestion.groupBy({ by: ["category"], _count: true }),
    ]);

    console.log("=".repeat(50));
    console.log(`🎉 시드 완료: ${seededCount}개 처리`);
    console.log(`   DB 총 문제 수: ${totalCount}개`);
    console.log("=".repeat(50));
    console.log("\n📊 난이도별 분포:");
    byDifficulty.forEach((item) => console.log(`   ${item.difficulty}: ${item._count}개`));
    console.log("\n📊 카테고리별 분포:");
    byCategory.forEach((item) => console.log(`   ${item.category}: ${item._count}개`));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("💥 시드 중 오류 발생:", error);
    process.exit(1);
  });
}
