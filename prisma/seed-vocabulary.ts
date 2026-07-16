import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import type { VocabularySource } from "@/entities/vocabulary";
import { PrismaClient } from "../lib/generated/prisma/client";
import { loadArtifact, VOCAB_ARTIFACT } from "./scripts/lib/load-artifact";

const SEED_TRANSACTION_TIMEOUT_MS = 5 * 60 * 1_000;

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  console.log("🌱 Vocabulary seed 시작...");

  const root = path.resolve(fileURLToPath(import.meta.url), "../..");
  const vocabularies = loadArtifact<VocabularySource>(root, VOCAB_ARTIFACT);
  console.log(`📦 generated artifact 로드: ${vocabularies.length}개 (${VOCAB_ARTIFACT.relPath})`);

  const prisma = createPrismaClient();

  try {
    await prisma.$transaction(
      async (transaction) => {
        for (const vocabulary of vocabularies) {
          await transaction.vocabulary.upsert({
            where: { word: vocabulary.word },
            update: {
              meaning: vocabulary.meaning,
              pronunciation: vocabulary.pronunciation ?? null,
              exampleSentence: vocabulary.exampleSentence ?? null,
              category: vocabulary.category,
              level: vocabulary.level,
            },
            create: {
              word: vocabulary.word,
              meaning: vocabulary.meaning,
              pronunciation: vocabulary.pronunciation ?? null,
              exampleSentence: vocabulary.exampleSentence ?? null,
              category: vocabulary.category,
              level: vocabulary.level,
            },
          });
        }
      },
      { timeout: SEED_TRANSACTION_TIMEOUT_MS }
    );

    const [finalCount, levelCounts, categoryCounts] = await Promise.all([
      prisma.vocabulary.count(),
      prisma.vocabulary.groupBy({ by: ["level"], _count: true }),
      prisma.vocabulary.groupBy({ by: ["category"], _count: true }),
    ]);

    console.log(`\n✨ Vocabulary seed 완료: ${vocabularies.length}개 처리`);
    console.log(`   DB 총 vocabulary 수: ${finalCount}개`);
    console.log("\n📊 레벨별 분포:");
    levelCounts.forEach((item) => console.log(`   ${item.level}: ${item._count}개`));
    console.log("\n📊 카테고리별 분포:");
    categoryCounts.forEach((item) => console.log(`   ${item.category}: ${item._count}개`));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("💥 Vocabulary seed 중 오류 발생:", error);
    process.exit(1);
  });
}
