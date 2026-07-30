import type { ListeningSubmission, QuizSubmission, ReadingSubmission } from "../types";

/** 판별자가 채워진 답안 — 하위 소비처는 이 형태만 본다. */
export type NormalizedSubmission = (ReadingSubmission & { type: "reading" }) | ListeningSubmission;

/**
 * 판별자 정규화의 **유일한 지점**.
 *
 * `type` 부재를 "reading" 으로 채운다. 이 기본값이 필요한 곳은 둘이다:
 *   - 제출 body — 배포 순간 옛 클라이언트가 보내는 답안
 *   - sessionStorage(quiz-answers-in-progress) 복원본 — 배포 경계에 걸친 진행 중 세션
 * 둘 다 정의상 읽기뿐이라 "부재 = reading" 이 안전하다.
 *
 * 경계에서 한 번 정규화하면 하위 소비처(제출 분기·결과 조립)는 완전히 판별된 유니온만 보고,
 * 나중에 type 을 필수로 바꾸거나 세 번째 유형을 더할 때 고칠 자리가 하나다.
 */
export function normalizeQuizSubmission(answer: QuizSubmission): NormalizedSubmission {
  if (answer.type === "listening") {
    return answer;
  }

  return { ...answer, type: "reading" };
}

export function normalizeQuizSubmissions(answers: readonly QuizSubmission[]): NormalizedSubmission[] {
  return answers.map(normalizeQuizSubmission);
}

/** 정규화된 답안을 유형별로 가른다. 라우트가 questionIds 를 모으기 **전에** 이걸 먼저 부른다. */
export function splitSubmissions(answers: readonly NormalizedSubmission[]): {
  reading: (ReadingSubmission & { type: "reading" })[];
  listening: ListeningSubmission[];
} {
  const reading: (ReadingSubmission & { type: "reading" })[] = [];
  const listening: ListeningSubmission[] = [];

  for (const answer of answers) {
    if (answer.type === "listening") {
      listening.push(answer);
    } else {
      reading.push(answer);
    }
  }

  return { reading, listening };
}
