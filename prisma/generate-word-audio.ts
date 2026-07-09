/**
 * Word/Example Audio Batch Generator
 *
 * audioUrl 또는 exampleAudioUrl이 비어 있는 항목만 Deepgram TTS로 생성해 R2에 업로드하고
 * DB에 공개 URL을 기록한다. 필드 단위 멱등 — 재실행 시 신규분만 생성.
 *
 * 실행: npx tsx prisma/generate-word-audio.ts [--limit N]
 */
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../lib/db";

const DEEPGRAM_MODEL = "aura-2-thalia-en";
const CONCURRENCY = 5;

const {
  DEEPGRAM_API_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
} = process.env;

if (
  !DEEPGRAM_API_KEY ||
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET ||
  !R2_PUBLIC_BASE_URL
) {
  console.error("필수 환경 변수 누락 — .env의 DEEPGRAM_API_KEY, R2_* 를 확인하세요.");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/** word는 @unique라 슬러그 충돌 위험 낮음. 영숫자 외 문자는 하이픈으로 정규화 */
function toSlug(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Deepgram Aura는 문장 단위 발화로 학습돼, 종결 문장부호가 없으면 단어마다 억양이 제각각이고
 * 끝이 잘린 듯 들린다. 단어·문장 모두 종결 부호를 보장해 일관된 평서문 억양을 얻는다.
 * (부호는 읽히지 않고 억양 신호로만 쓰인다.) 멱등 — 이미 . ! ? 로 끝나면 그대로 둔다.
 * 모든 TTS 입력은 반드시 이 함수를 거쳐 synthesize로 들어간다.
 */
function ensureTerminalPunctuation(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

async function synthesize(text: string): Promise<Buffer> {
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${DEEPGRAM_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: ensureTerminalPunctuation(text) }),
  });
  if (!res.ok) {
    throw new Error(`Deepgram ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function upload(key: string, audio: Buffer): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: audio,
      ContentType: "audio/mpeg",
    })
  );
  return `${R2_PUBLIC_BASE_URL}/${key}`;
}

interface Target {
  id: string;
  word: string;
  exampleSentence: string | null;
  audioUrl: string | null;
  exampleAudioUrl: string | null;
}

async function processVocab(v: Target): Promise<void> {
  const data: { audioUrl?: string; exampleAudioUrl?: string } = {};

  if (!v.audioUrl) {
    const slug = toSlug(v.word);
    data.audioUrl = await upload(`words/${slug}.mp3`, await synthesize(v.word));
  }
  if (v.exampleSentence && !v.exampleAudioUrl) {
    const slug = toSlug(v.word);
    data.exampleAudioUrl = await upload(
      `examples/${slug}.mp3`,
      await synthesize(v.exampleSentence)
    );
  }

  if (Object.keys(data).length > 0) {
    await prisma.vocabulary.update({ where: { id: v.id }, data });
  }
}

async function main() {
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
