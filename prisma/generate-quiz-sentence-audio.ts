/**
 * Quiz Sentence Audio Batch Generator
 *
 * sentenceAudioUrl이 비어 있는 QuizQuestion의 완성 문장(빈칸→정답)을 생성해 R2에 올리고 URL을 기록한다.
 * 멱등 — 재실행 시 신규분만. 실행: npx tsx prisma/generate-quiz-sentence-audio.ts [--limit N]
 */
import "dotenv/config";
import prisma from "../lib/db";
import { createTtsUploader } from "./lib/tts";
import { fillBlank } from "../features/quiz/lib/fill-blank";

const CONCURRENCY = 5;

async function main() {
  const { synthesizeAndUpload } = createTtsUploader();

  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : undefined;

  const targets = await prisma.quizQuestion.findMany({
    where: { sentenceAudioUrl: null },
    select: {
      id: true,
      sentence: true,
      options: { select: { text: true, isCorrect: true } },
    },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`생성 대상: ${targets.length}개`);

  async function processQuestion(q: (typeof targets)[number]): Promise<void> {
    const correct = q.options.find((o) => o.isCorrect);
    if (!correct) throw new Error(`정답 옵션 없음: ${q.id}`);
    const complete = fillBlank(q.sentence, correct.text);
    const url = await synthesizeAndUpload(complete, `quiz-sentences/${q.id}.mp3`);
    await prisma.quizQuestion.update({
      where: { id: q.id },
      data: { sentenceAudioUrl: url },
    });
  }

  let done = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processQuestion));
    for (const [j, r] of results.entries()) {
      if (r.status === "fulfilled") {
        done += 1;
      } else {
        failed += 1;
        console.error(`실패: ${batch[j].id} — ${r.reason}`);
      }
    }
    console.log(`진행: ${done + failed}/${targets.length} (실패 ${failed})`);
  }
  console.log(`완료: 성공 ${done}, 실패 ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
