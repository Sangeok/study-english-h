/**
 * SRS Enrollment
 *
 * 데일리 퀴즈에서 만난 단어를 복습 큐에 편입한다 (CONTEXT.md: 퀴즈 편입).
 * 정답·오답을 가리지 않고 편입하며, 확신도에 따라 첫 복습 시점만 다르게 잡는다(ADR 0002).
 * best-effort 계약: 실패는 null 로 흡수하고 호출부(퀴즈 제출)를 실패시키지 않는다.
 * 주의 — null 은 "편입 실패" 신호이지 무편입 보장이 아니다: 각 recordReview upsert 는
 * 독립 커밋이라 일부 단어만 편입된 채 실패할 수 있다(부분 편입은 다음 퀴즈·복습에서 자연 수렴).
 * 반환이 non-null 이면 enrolledCount 는 전부 커밋된 확정 개수다.
 */

import prisma from "@/lib/db";
import type { ReviewQuality } from "../types";
import { recordReview } from "./srs-service";

// QuizSummary["srs"](features/quiz/types/index.ts)와 구조를 반드시 함께 바꾼다 —
// FSD 사이드웨이 import 회피로 타입 링크가 없어, 여기에 필드를 추가해도 컴파일은 통과하지만
// 응답 계약(QuizSummary.srs)에는 조용히 누락된다.
export interface SrsEnrollmentResult {
  /** 복습 큐에 편입된 단어 수 — 정답 단어를 포함한다(오답 수가 아니다). */
  enrolledCount: number;
}

/** 퀴즈 한 문항의 학습 신호. 편입 여부가 아니라 "첫 복습 시점"을 가른다. */
export interface QuizWordOutcome {
  readonly word: string;
  readonly isCorrect: boolean;
  /**
   * 힌트를 한 단계라도 열었는지. 힌트 2단계는 한국어 뜻을 공개하므로
   * 힌트를 쓴 정답은 확신도가 낮다고 본다.
   */
  readonly usedHint: boolean;
  /**
   * 산출로 맞혔는가 — 타이핑에서 오디오도 힌트도 없이 철자를 써낸 경우만 true.
   *
   * 4지선다 정답을 easy 로 안 쓰는 이유가 소거법인데(아래), 타이핑에는 소거법이 없다.
   * 뜻 → 인출 → 철자를 혼자 해낸 것이라 퀴즈 경로에서 얻을 수 있는 가장 강한 증거다.
   * 발음을 들었으면 인출 단계가 빠진 것이므로 false 로 온다(사실상 받아쓰기).
   */
  readonly produced?: boolean;
}

type Confidence = "wrong" | "hintedCorrect" | "cleanCorrect" | "producedCorrect";

/**
 * 확신도 → recordReview 인자. initialRepetitions 시드로 첫 복습 간격이 결정된다.
 *   오답           → 1일 (repetitions 리셋 + easeFactor -0.2)
 *   힌트 쓴 정답   → 3일 (DEFAULT_INTERVALS.learning)
 *   힌트 없는 정답 → 7일 (DEFAULT_INTERVALS.reviewing)
 *   산출 정답      → easy (easeFactor +0.15 → 간격 성장률 6% 상승)
 *
 * **4지선다 정답은 소거법으로도 맞힐 수 있어 easy 로 취급하지 않는다.** 그 사유가
 * 타이핑에는 적용되지 않아 producedCorrect 가 생겼다 — 보기가 없으면 찍을 수 없다.
 *
 * producedCorrect 의 initialRepetitions 가 cleanCorrect 와 같은 것은 의도다: 타이핑은
 * 편입된 단어만 출제하므로 UserVocabulary 행이 반드시 있고, 그러면 recordReview 가
 * initialRepetitions 를 무시한다(srs-service.ts — `userVocab?.repetitions ?? initialRepetitions`).
 * 행이 없는 경우까지 3 으로 올리면 오히려 간격이 짧아진다 — repetitions 4 부터는
 * interval × easeFactor 인데 갓 만든 카드의 interval 이 1 이라 1×2.65 ≈ 3일이 된다.
 */
const CONFIDENCE_REVIEW: Record<
  Confidence,
  { quality: ReviewQuality; isCorrect: boolean; initialRepetitions: number }
> = {
  wrong: { quality: "forgot", isCorrect: false, initialRepetitions: 0 },
  hintedCorrect: { quality: "hard", isCorrect: true, initialRepetitions: 1 },
  cleanCorrect: { quality: "normal", isCorrect: true, initialRepetitions: 2 },
  producedCorrect: { quality: "easy", isCorrect: true, initialRepetitions: 2 },
};

// 같은 단어가 한 퀴즈에 두 번 나오면 가장 보수적인 신호를 남긴다
//   (오답 > 힌트 정답 > 무힌트 정답 > 산출 정답).
const CONFIDENCE_RANK: Record<Confidence, number> = {
  wrong: 0,
  hintedCorrect: 1,
  cleanCorrect: 2,
  producedCorrect: 3,
};

function classify(outcome: QuizWordOutcome): Confidence {
  if (!outcome.isCorrect) return "wrong";
  if (outcome.usedHint) return "hintedCorrect";
  return outcome.produced ? "producedCorrect" : "cleanCorrect";
}

/** 콘텐츠 파이프라인의 단어 비교 규칙과 동일(lowercase + trim). */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

export async function enrollWordsToSrs(
  userId: string,
  outcomes: QuizWordOutcome[]
): Promise<SrsEnrollmentResult | null> {
  try {
    const confidenceByWord = new Map<string, Confidence>();
    for (const outcome of outcomes) {
      const word = normalizeWord(outcome.word);
      if (!word) continue;

      const confidence = classify(outcome);
      const previous = confidenceByWord.get(word);
      if (previous && CONFIDENCE_RANK[previous] <= CONFIDENCE_RANK[confidence]) {
        continue;
      }
      confidenceByWord.set(word, confidence);
    }

    if (confidenceByWord.size === 0) {
      return { enrolledCount: 0 };
    }

    // Vocabulary.word 는 @unique, 소스 파이프라인이 lowercase 기준 conflict 0 을 보장하므로
    // insensitive 조회의 단어당 매치는 최대 1건이다. 미연결 단어는 여기서 자연 탈락한다.
    const vocabularies = await prisma.vocabulary.findMany({
      where: { word: { in: [...confidenceByWord.keys()], mode: "insensitive" } },
      select: { id: true, word: true },
    });

    // 각 호출은 단어별 다른 행이라 서로 독립 — 병렬 실행한다. N은 데일리 퀴즈 크기(~10)로 유계.
    const enrollments = vocabularies.flatMap((vocabulary) => {
      const confidence = confidenceByWord.get(normalizeWord(vocabulary.word));
      if (!confidence) return [];

      const review = CONFIDENCE_REVIEW[confidence];
      return [
        recordReview(
          userId,
          vocabulary.id,
          review.quality,
          review.isCorrect,
          review.initialRepetitions
        ),
      ];
    });

    await Promise.all(enrollments);

    return { enrolledCount: enrollments.length };
  } catch (error) {
    console.error("SRS enrollment error:", error);
    return null;
  }
}
