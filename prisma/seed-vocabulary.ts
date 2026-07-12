/**
 * Vocabulary Seed Script
 *
 * generated artifact(build 산출물)를 읽어 word 기준 upsert 로 적재한다.
 * source 를 직접 조합하지 않는다 — 먼저 `npm run content:build:vocabulary` 로 artifact 를 생성해야 하며,
 * 부재 시 즉시 실패한다(fail-fast, RFC Phase 3).
 * skipDuplicates 대신 word 기준 upsert 로 멱등 재시딩한다(seed-quiz 와 대칭). silent skip 없음 —
 *   중복/충돌은 build 이전 validate·collision report 가 이미 가시화한다.
 *
 * 실행: npm run content:build:vocabulary && npx tsx prisma/seed-vocabulary.ts
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import prisma from "../lib/db";
import { loadArtifact, VOCAB_ARTIFACT } from "./scripts/lib/load-artifact";

type SeedVocabulary = {
  word: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  category: string;
  level: string;
};

async function main() {
  console.log("🌱 Starting vocabulary seed...");

  try {
    // build 산출물만 읽는다. artifact 부재 시 즉시 실패(재생성 명령 안내) — DB 접근 전에 걸러진다.
    const root = path.resolve(fileURLToPath(import.meta.url), "../..");
    const allVocabularies = loadArtifact<SeedVocabulary>(root, VOCAB_ARTIFACT);
    console.log(`📦 generated artifact 로드: ${allVocabularies.length}개 (${VOCAB_ARTIFACT.relPath})`);

    const existingCount = await prisma.vocabulary.count();
    console.log(`📊 Existing vocabularies: ${existingCount}`);

    // word 기준 upsert — skipDuplicates 없이 멱등 적재. artifact 가 source of truth 이므로
    // source 필드는 artifact 값으로 수렴시킨다(audioUrl 등 비-source 필드는 update 대상이 아니라 보존).
    let processed = 0;
    for (const vocab of allVocabularies) {
      await prisma.vocabulary.upsert({
        where: { word: vocab.word },
        update: {
          meaning: vocab.meaning,
          pronunciation: vocab.pronunciation ?? null,
          exampleSentence: vocab.exampleSentence ?? null,
          category: vocab.category,
          level: vocab.level,
        },
        create: {
          word: vocab.word,
          meaning: vocab.meaning,
          pronunciation: vocab.pronunciation ?? null,
          exampleSentence: vocab.exampleSentence ?? null,
          category: vocab.category,
          level: vocab.level,
        },
      });

      processed++;
      if (processed % 100 === 0 || processed === allVocabularies.length) {
        console.log(`✓ Upserted ${processed}/${allVocabularies.length} vocabularies`);
      }
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
