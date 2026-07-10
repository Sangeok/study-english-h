/**
 * 공용 TTS 모듈 — Deepgram 합성 + R2 업로드 + 종결 문장부호 보장.
 * 어휘 배치(generate-word-audio.ts)·퀴즈 배치(generate-quiz-sentence-audio.ts)가 공유한다.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const DEEPGRAM_MODEL = "aura-2-thalia-en";

/**
 * Deepgram Aura는 문장 단위 발화로 학습돼, 종결 문장부호가 없으면 단어마다 억양이 제각각이고
 * 끝이 잘린 듯 들린다. 단어·문장 모두 종결 부호를 보장해 일관된 평서문 억양을 얻는다.
 * (부호는 읽히지 않고 억양 신호로만 쓰인다.) 멱등 — 이미 . ! ? 로 끝나면 그대로 둔다.
 * 모든 TTS 입력은 반드시 이 함수를 거친다.
 */
export function ensureTerminalPunctuation(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** 배치 스크립트 공용 TTS 클라이언트. env 검증 후 합성+업로드 함수를 반환한다. */
export function createTtsUploader() {
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

  /** 텍스트를 합성해 R2 key에 업로드하고 공개 URL을 반환한다. */
  async function synthesizeAndUpload(text: string, key: string): Promise<string> {
    const audio = await synthesize(text);
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

  return { synthesizeAndUpload };
}
