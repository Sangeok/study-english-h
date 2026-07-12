/**
 * Vocabulary Seed Script
 *
 * 모든 vocabulary source 파일(prisma/data/vocabularies*.json)을 합쳐 DB에 누적 upsert 한다.
 * 데이터를 소유하지 않고 source 파일만 읽는다 — 인라인 배열은 vocabularies-extra-inline.json 으로 분리됨.
 * 파괴적 reset 은 하지 않는다(createMany + skipDuplicates 누적 적재).
 *
 * 실행: npx tsx prisma/seed-vocabulary.ts
 */

import { pathToFileURL } from "node:url";
import prisma from "../lib/db";
import baseVocabularies from "./data/vocabularies.json";
import extraA1A2 from "./data/vocabularies-extra-a1-a2.json";
import extraB1B2 from "./data/vocabularies-extra-b1-b2.json";
import extraC1C2 from "./data/vocabularies-extra-c1-c2.json";
import extraSupplement from "./data/vocabularies-extra-supplement.json";
import extraInline from "./data/vocabularies-extra-inline.json";

async function main() {
  console.log("🌱 Starting vocabulary seed...");

  try {
    const existingCount = await prisma.vocabulary.count();
    console.log(`📊 Existing vocabularies: ${existingCount}`);

    // 모든 source 파일을 합친다. (예전 seed 파일에 박혀 있던 인라인 130개는 extraInline 으로 분리)
    const allVocabularies = [
      ...baseVocabularies,
      ...extraA1A2,
      ...extraB1B2,
      ...extraC1C2,
      ...extraSupplement,
      ...extraInline,
    ];

    console.log(`📝 Preparing to seed ${allVocabularies.length} vocabularies...`);

    // Insert vocabularies in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < allVocabularies.length; i += batchSize) {
      const batch = allVocabularies.slice(i, i + batchSize);

      await prisma.vocabulary.createMany({
        data: batch,
        skipDuplicates: true, // Skip if word already exists
      });

      inserted += batch.length;
      console.log(`✓ Inserted ${inserted}/${allVocabularies.length} vocabularies`);
    }

    // Verify counts
    const finalCount = await prisma.vocabulary.count();
    const levelCounts = await prisma.vocabulary.groupBy({
      by: ["level"],
      _count: true,
    });

    const categoryCounts = await prisma.vocabulary.groupBy({
      by: ["category"],
      _count: true,
    });

    console.log("\n📊 Final Statistics:");
    console.log(`   Total vocabularies: ${finalCount}`);
    console.log("\n   By Level:");
    levelCounts.forEach((lc) => {
      console.log(`   - ${lc.level}: ${lc._count}`);
    });
    console.log("\n   By Category:");
    categoryCounts.forEach((cc) => {
      console.log(`   - ${cc.category}: ${cc._count}`);
    });

    console.log("\n✨ Vocabulary seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding vocabularies:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// tsx 로 직접 실행될 때만 seed 를 수행한다(다른 스크립트가 데이터만 import 할 때 DB 연결 방지).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
