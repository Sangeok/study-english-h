/**
 * Word/Example Audio Batch Generator
 *
 * audioUrl 또는 exampleAudioUrl이 비어 있는 항목만 Deepgram TTS로 생성해 R2에 업로드하고
 * DB에 공개 URL을 기록한다. 필드 단위 멱등 — 재실행 시 신규분만 생성.
 *
 * 실행: npx tsx prisma/generate-word-audio.ts [--limit N]
 */
import "dotenv/config";
import prisma from "../lib/db";
import { createTtsUploader } from "./lib/tts";

const CONCURRENCY = 5;

/** word는 @unique라 슬러그 충돌 위험 낮음. 영숫자 외 문자는 하이픈으로 정규화 */
function toSlug(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Target {
  id: string;
  word: string;
  exampleSentence: string | null;
  audioUrl: string | null;
  exampleAudioUrl: string | null;
}

async function main() {
  const { synthesizeAndUpload } = createTtsUploader();

  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : undefined;

  const targets = await prisma.vocabulary.findMany({
    where: {
      OR: [
        { audioUrl: null },
        { AND: [{ exampleSentence: { not: null } }, { exampleAudioUrl: null }] },
      ],
    },
    select: {
      id: true,
      word: true,
      exampleSentence: true,
      audioUrl: true,
      exampleAudioUrl: true,
    },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`생성 대상: ${targets.length}개`);

  async function processVocab(v: Target): Promise<void> {
    const data: { audioUrl?: string; exampleAudioUrl?: string } = {};
    const slug = toSlug(v.word);

    if (!v.audioUrl) {
      data.audioUrl = await synthesizeAndUpload(v.word, `words/${slug}.mp3`);
    }
    if (v.exampleSentence && !v.exampleAudioUrl) {
      data.exampleAudioUrl = await synthesizeAndUpload(
        v.exampleSentence,
        `examples/${slug}.mp3`
      );
    }

    if (Object.keys(data).length > 0) {
      await prisma.vocabulary.update({ where: { id: v.id }, data });
    }
  }

  let done = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processVocab));
    for (const [j, r] of results.entries()) {
      if (r.status === "fulfilled") {
        done += 1;
      } else {
        failed += 1;
        console.error(`실패: ${batch[j].word} — ${r.reason}`);
      }
    }
    console.log(`진행: ${done + failed}/${targets.length} (실패 ${failed})`);
  }
  console.log(`완료: 성공 ${done}, 실패 ${failed} — 실패분은 재실행으로 재시도`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
