/**
 * SRS Enrollment
 *
 * 퀴즈 오답 단어를 복습 큐에 편입한다 (CONTEXT.md: 오답 편입).
 * best-effort 계약: 실패는 null 로 흡수하고 호출부(퀴즈 제출)를 실패시키지 않는다.
 * 주의 — null 은 "편입 실패" 신호이지 무편입 보장이 아니다: 각 recordReview upsert 는
 * 독립 커밋이라 일부 단어만 편입된 채 실패할 수 있다(부분 편입은 다음 오답·복습에서 자연 수렴).
 * 반환이 non-null 이면 enrolledCount 는 전부 커밋된 확정 개수다.
 */

import prisma from "@/lib/db";
import { recordReview } from "./srs-service";

// QuizSummary["srs"](features/quiz/types/index.ts)와 구조를 반드시 함께 바꾼다 —
// FSD 사이드웨이 import 회피로 타입 링크가 없어, 여기에 필드를 추가해도 컴파일은 통과하지만
// 응답 계약(QuizSummary.srs)에는 조용히 누락된다.
export interface SrsEnrollmentResult {
  enrolledCount: number;
}

export async function enrollWordsToSrs(
  userId: string,
  words: string[]
): Promise<SrsEnrollmentResult | null> {
  try {
    // 정규화·중복 제거 — 콘텐츠 파이프라인의 단어 비교 규칙(lowercase+trim)과 동일
    const normalized = Array.from(
      new Set(words.map((word) => word.toLowerCase().trim()).filter(Boolean))
    );
    if (normalized.length === 0) {
      return { enrolledCount: 0 };
    }

    // Vocabulary.word 는 @unique, 소스 파이프라인이 lowercase 기준 conflict 0 을 보장하므로
    // insensitive 조회의 단어당 매치는 최대 1건이다. 미연결 단어는 여기서 자연 탈락한다.
    const vocabularies = await prisma.vocabulary.findMany({
      where: { word: { in: normalized, mode: "insensitive" } },
      select: { id: true },
    });

    // 플래시카드 오답과 동일 경로 — repetitions 리셋, easeFactor -0.2(하한 1.3), 다음날 복습 도래.
    // 이 효과는 isCorrect=false 단독으로 결정된다(-0.2 = WRONG_ANSWER_EASE_PENALTY);
    // quality("forgot")는 오답 경로에서 읽히지 않는 인자다 — EASE_FACTOR_ADJUSTMENTS.forgot
    // 을 조정해도 이 편입 경로에는 영향이 없다.
    // 각 호출은 단어별 다른 행이라 서로 독립 — 병렬 실행한다. N은 데일리 퀴즈 크기(~10)로 유계.
    await Promise.all(
      vocabularies.map((vocabulary) => recordReview(userId, vocabulary.id, "forgot", false))
    );

    return { enrolledCount: vocabularies.length };
  } catch (error) {
    console.error("SRS enrollment error:", error);
    return null;
  }
}
