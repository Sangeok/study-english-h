/**
 * Vocabulary Merge Script
 *
 * Merges existing vocabulary with expansion files
 * Run with: npx tsx prisma/merge-vocabulary.ts
 */

import fs from "fs";
import path from "path";

interface Vocabulary {
  word: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
  category: "daily" | "business" | "toeic" | "travel";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

async function mergeVocabularies() {
  try {
    console.log("📚 Starting vocabulary merge...\n");

    // Read existing vocabulary
    const mainPath = path.join(process.cwd(), "prisma/data/vocabularies.json");
    let mainData: Vocabulary[] = [];

    if (fs.existsSync(mainPath)) {
      mainData = JSON.parse(fs.readFileSync(mainPath, "utf-8"));
      console.log(`✅ Loaded ${mainData.length} existing vocabularies`);
    }

    // Read expansion files
    const expansionFiles = [
      "prisma/data/vocabularies-expansion.json",
      "prisma/data/vocabulary-expansion-large.json",
    ];

    let totalNew = 0;
    const allData = [...mainData];
    const existingWords = new Set(mainData.map((v) => v.word.toLowerCase()));

    for (const file of expansionFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const expansionData: Vocabulary[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const uniqueNew = expansionData.filter((v) => !existingWords.has(v.word.toLowerCase()));

        uniqueNew.forEach((v) => {
          existingWords.add(v.word.toLowerCase());
          allData.push(v);
        });

        console.log(`✅ Added ${uniqueNew.length} new words from ${path.basename(file)}`);
        totalNew += uniqueNew.length;
      }
    }

    // Sort by level and word
    const levelOrder = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    allData.sort((a, b) => {
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return a.word.localeCompare(b.word);
    });

    // Write merged file
    const outputPath = path.join(process.cwd(), "prisma/data/vocabularies-merged.json");
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf-8");

    console.log(`\n✅ Merge complete!`);
    console.log(`📊 Total vocabularies: ${allData.length} (added ${totalNew} new)`);

    // Statistics
    console.log(`\n📊 Distribution by Level:`);
    const byLevel = allData.reduce((acc, v) => {
      acc[v.level] = (acc[v.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byLevel)
      .sort(([a], [b]) => levelOrder[a as keyof typeof levelOrder] - levelOrder[b as keyof typeof levelOrder])
      .forEach(([level, count]) => {
        console.log(`   ${level}: ${count} words`);
      });

    console.log(`\n📊 Distribution by Category:`);
    const byCategory = allData.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byCategory)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        const percentage = ((count / allData.length) * 100).toFixed(1);
        console.log(`   ${category}: ${count} words (${percentage}%)`);
      });

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the merged file: prisma/data/vocabularies-merged.json`);
    console.log(`   2. Backup original: mv vocabularies.json vocabularies-backup.json`);
    console.log(`   3. Replace: mv vocabularies-merged.json vocabularies.json`);
    console.log(`   4. Seed database: npx tsx prisma/seed-vocabulary.ts`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

mergeVocabularies();
