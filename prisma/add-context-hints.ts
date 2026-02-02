/**
 * Context Hints Migration Script
 *
 * 기존 퀴즈 문제에 카테고리별 기본 상황 힌트를 일괄 적용합니다.
 *
 * 실행 방법:
 * npx tsx prisma/add-context-hints.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// 카테고리별 기본 상황 힌트 템플릿
const CONTEXT_HINT_TEMPLATES: Record<string, Record<string, string>> = {
  daily: {
    A1: "일상에서 자주 사용하는 기본 표현입니다.",
    A2: "일상 대화에서 사용하는 표현입니다.",
    B1: "일상적인 상황을 자연스럽게 표현하는 문법입니다.",
    B2: "일상에서 뉘앙스를 살린 표현입니다.",
    C1: "고급 일상 표현으로 정교한 의미를 전달합니다.",
    C2: "원어민 수준의 일상 표현입니다.",
  },
  business: {
    A1: "직장에서 사용하는 기본 비즈니스 표현입니다.",
    A2: "업무 환경에서 자주 쓰이는 표현입니다.",
    B1: "비즈니스 회의나 이메일에서 사용하는 표현입니다.",
    B2: "전문적인 비즈니스 커뮤니케이션 표현입니다.",
    C1: "고급 비즈니스 협상에서 사용되는 표현입니다.",
    C2: "전문가 수준의 비즈니스 영어 표현입니다.",
  },
  toeic: {
    A1: "토익 시험에 자주 나오는 기본 표현입니다.",
    A2: "토익 Part 5-6에서 자주 출제되는 문법입니다.",
    B1: "토익 고득점을 위한 필수 표현입니다.",
    B2: "토익 800점 이상을 위한 중급 표현입니다.",
    C1: "토익 900점 이상을 위한 고급 표현입니다.",
    C2: "토익 만점을 위한 최고 난이도 표현입니다.",
  },
  travel: {
    A1: "여행 중 기본적으로 필요한 표현입니다.",
    A2: "여행지에서 자주 사용하는 실용 표현입니다.",
    B1: "해외 여행 시 유용하게 쓰이는 표현입니다.",
    B2: "다양한 여행 상황에서 활용 가능한 표현입니다.",
    C1: "현지인과 자연스럽게 소통할 수 있는 여행 표현입니다.",
    C2: "원어민 수준의 여행 대화 표현입니다.",
  },
  idioms: {
    A1: "쉽게 이해할 수 있는 기본 관용 표현입니다.",
    A2: "일상에서 자주 쓰이는 관용구입니다.",
    B1: "영어 대화에서 자주 등장하는 숙어입니다.",
    B2: "영어 원어민이 자주 사용하는 관용 표현입니다.",
    C1: "문학이나 비즈니스에서 쓰이는 고급 관용구입니다.",
    C2: "원어민도 어려워하는 고급 숙어 표현입니다.",
  },
};

async function addContextHints() {
  console.log("🚀 Context Hints 마이그레이션 시작...\n");

  try {
    // 모든 퀴즈 문제 가져오기
    const questions = await prisma.quizQuestion.findMany({
      select: {
        id: true,
        category: true,
        difficulty: true,
        contextHintKo: true,
      },
    });

    console.log(`📊 총 ${questions.length}개의 퀴즈 문제를 발견했습니다.\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const question of questions) {
      // 이미 contextHintKo가 있으면 건너뛰기
      if (question.contextHintKo) {
        skippedCount++;
        continue;
      }

      // 카테고리와 난이도에 맞는 템플릿 찾기
      const categoryTemplates = CONTEXT_HINT_TEMPLATES[question.category];
      if (!categoryTemplates) {
        console.warn(`⚠️  알 수 없는 카테고리: ${question.category}`);
        skippedCount++;
        continue;
      }

      const contextHint = categoryTemplates[question.difficulty];
      if (!contextHint) {
        console.warn(`⚠️  알 수 없는 난이도: ${question.difficulty}`);
        skippedCount++;
        continue;
      }

      // 상황 힌트 업데이트
      await prisma.quizQuestion.update({
        where: { id: question.id },
        data: { contextHintKo: contextHint },
      });

      updatedCount++;
    }

    console.log("\n✅ 마이그레이션 완료!");
    console.log(`   - 업데이트된 문제: ${updatedCount}개`);
    console.log(`   - 건너뛴 문제: ${skippedCount}개`);
    console.log(`   - 총 문제 수: ${questions.length}개\n`);

  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
addContextHints()
  .then(() => {
    console.log("🎉 모든 작업이 성공적으로 완료되었습니다!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 스크립트 실행 실패:", error);
    process.exit(1);
  });
