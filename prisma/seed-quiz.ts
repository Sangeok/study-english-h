/**
 * Quiz Questions Seed Script
 *
 * JSON 파일에서 퀴즈 데이터를 읽어 upsert(difficulty + englishWord 기준)로 갱신합니다.
 * 기본은 비파괴 — 기존 문항과 유저 퀴즈 이력을 보존합니다.
 * SEED_RESET=1 을 주면 파괴적 전체 리셋(문항 + CASCADE 로 유저 퀴즈 이력)을 먼저 수행합니다.
 *
 * 실행 방법:
 * npx tsx prisma/seed-quiz.ts              # 비파괴 upsert (권장)
 * SEED_RESET=1 npx tsx prisma/seed-quiz.ts # 파괴적 전체 리셋 후 재삽입
 */

import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  QuestionDifficulty,
  QuestionCategory,
} from "../lib/generated/prisma/client";
import dotenv from "dotenv";
import quizQuestions from "./data/quiz-questions.json";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

type SeedQuizQuestion = {
  koreanHint: string;
  contextHintKo: string;
  englishWord: string;
  sentence: string;
  difficulty: string;
  category: string;
  options: { text: string; isCorrect: boolean; order: number }[];
};

async function main() {
  console.log("🌱 퀴즈 데이터 시드 시작...\n");

  // 파괴적 전체 리셋은 SEED_RESET=1 일 때만. 기본은 아래 upsert 로 비파괴 갱신한다.
  // quizQuestion 삭제 시 CASCADE 로 QuizOption·UserQuizAttempt(유저 퀴즈 이력)가 함께 삭제된다.
  if (process.env.SEED_RESET === "1") {
    const existingCount = await prisma.quizQuestion.count();
    if (existingCount > 0) {
      console.log(`🗑️  [SEED_RESET] 기존 문제 ${existingCount}개 + 연결된 유저 이력 삭제 중...`);
      await prisma.quizQuestion.deleteMany({});
      console.log("✅ 기존 데이터 삭제 완료\n");
    }
  }

  let successCount = 0;
  let errorCount = 0;

  for (const question of quizQuestions as SeedQuizQuestion[]) {
    try {
      await prisma.quizQuestion.upsert({
        where: {
          difficulty_englishWord: {
            difficulty: question.difficulty as QuestionDifficulty,
            englishWord: question.englishWord,
          },
        },
        update: {
          koreanHint: question.koreanHint,
          contextHintKo: question.contextHintKo,
          sentence: question.sentence,
          category: question.category as QuestionCategory,
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
          difficulty: question.difficulty as QuestionDifficulty,
          category: question.category as QuestionCategory,
          options: {
            create: question.options,
          },
        },
      });

      successCount++;
    } catch (error) {
      console.error(`❌ 실패: "${question.koreanHint}" - ${error}`);
      errorCount++;
    }
  }

  // 결과 통계
  const totalCount = await prisma.quizQuestion.count();

  console.log("=".repeat(50));
  console.log("🎉 시드 완료!");
  console.log(`   추가된 문제: ${successCount}개`);
  console.log(`   실패한 문제: ${errorCount}개`);
  console.log(`   DB 총 문제 수: ${totalCount}개`);
  console.log("=".repeat(50));

  // 분포 확인
  const byDifficulty = await prisma.quizQuestion.groupBy({
    by: ["difficulty"],
    _count: true,
  });
  const byCategory = await prisma.quizQuestion.groupBy({
    by: ["category"],
    _count: true,
  });

  console.log("\n📊 난이도별 분포:");
  byDifficulty.forEach((d) => console.log(`   ${d.difficulty}: ${d._count}개`));

  console.log("\n📊 카테고리별 분포:");
  byCategory.forEach((c) => console.log(`   ${c.category}: ${c._count}개`));
}

main()
  .catch((error) => {
    console.error("💥 시드 중 오류 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
