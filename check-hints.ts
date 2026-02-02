import { PrismaClient } from './lib/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    const samples = await prisma.quizQuestion.findMany({
      select: {
        sentence: true,
        koreanHint: true,
        contextHintKo: true,
        difficulty: true,
        category: true,
      },
      take: 5,
    });

    console.log('\n=== 샘플 퀴즈 문제 5개 ===\n');
    samples.forEach((q, idx) => {
      console.log(`[${idx + 1}] ${q.difficulty} - ${q.category}`);
      console.log(`문장: ${q.sentence}`);
      console.log(`한국어 힌트: ${q.koreanHint}`);
      console.log(`상황 힌트: ${q.contextHintKo || '(없음)'}`);
      console.log('');
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
