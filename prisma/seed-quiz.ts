import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import type { QuizQuestionSource } from "@/entities/question/lib/quiz-source-schema";
import { PrismaClient } from "../lib/generated/prisma/client";
import { loadArtifact, QUIZ_ARTIFACT } from "./scripts/lib/load-artifact";
import { QUIZ_SEED_CONCURRENCY, resolveQuizSeedMode, seedQuizQuestions } from "./scripts/lib/quiz-seed";

/**
 * 단일 트랜잭션으로 감싸지 않는다 — 887문항이 5분 제한을 넘겨 전량 롤백된다(seed-vocabulary 와 같은 이유).
 *
 * 대가: reset 모드가 원자적이지 않다. 삭제 후 적재 도중 끊기면 문항이 부분만 남는다.
 * upsert 가 멱등이라 재실행으로 복구되고, reset 은 어차피 UserQuizAttempt 까지 cascade 로
 * 지우는 명시적 파괴 작업이라 감수한다.
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: QUIZ_SEED_CONCURRENCY,
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
    const seededCount = await seedQuizQuestions({
      questions: quizQuestions,
      mode,
      onProgress: (processed, total) => {
        if (processed % 100 === 0 || processed === total) {
          console.log(`   ... ${processed}/${total}`);
        }
      },
      operations: {
        deleteExisting: () => prisma.quizQuestion.deleteMany({}),
        upsert: (question) =>
          prisma.quizQuestion.upsert({
            where: {
              difficulty_englishWord: {
                difficulty: question.difficulty,
                englishWord: question.englishWord,
              },
            },
            // sentenceAudioUrl 은 소스에 없다. update 에서 빼야 기존 문장 음성이 지워지지 않는다.
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
    });

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
