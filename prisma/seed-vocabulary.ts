import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import type { VocabularySource } from "@/entities/vocabulary";
import { PrismaClient } from "../lib/generated/prisma/client";
import { loadArtifact, VOCAB_ARTIFACT } from "./scripts/lib/load-artifact";

/**
 * 원격 DB 왕복이 200ms 안팎이라 4,650건을 순차 upsert 하면 16분이 걸린다.
 * 단일 트랜잭션으로 감싸면 5분 제한에 걸려 전량 롤백되므로(P2028) 트랜잭션을 걷어내고
 * 소규모 병렬 배치로 나눈다. upsert 는 word 단위 멱등이라 중간에 끊겨도 재실행하면 이어진다.
 */
const UPSERT_CONCURRENCY = 10;
const PROGRESS_INTERVAL = 500;

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: UPSERT_CONCURRENCY,
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
    for (let offset = 0; offset < vocabularies.length; offset += UPSERT_CONCURRENCY) {
      const batch = vocabularies.slice(offset, offset + UPSERT_CONCURRENCY);

      await Promise.all(
        batch.map((vocabulary) =>
          prisma.vocabulary.upsert({
            where: { word: vocabulary.word },
            // 오디오 URL(audioUrl·exampleAudioUrl)은 소스에 없다. update 에서 빼야 기존 음성이 지워지지 않는다.
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
          })
        )
      );

      const processed = offset + batch.length;
      if (processed % PROGRESS_INTERVAL === 0 || processed === vocabularies.length) {
        console.log(`   ... ${processed}/${vocabularies.length}`);
      }
    }

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
