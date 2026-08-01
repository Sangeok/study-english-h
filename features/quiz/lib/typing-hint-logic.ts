/**
 * 타이핑 전용 힌트 사다리.
 *
 * quiz-hint-logic(읽기)·listening-hint-logic(듣기) 에서 아무것도 import 하지 않는다.
 * 읽기 술어 넷은 전부 contextHint 를 보는데 타이핑 문항에는 그 필드가 없어 사다리가
 * 1단계로 접힌다 — P2-1 이 리스닝에서 겪은 결함이고, 특히 버튼 표시 술어를 재사용하면
 * 훅이 2단계를 허용해도 사용자가 요청할 방법이 사라진다.
 *
 * 사다리:
 *   1단계 예문 빈칸  — 맥락으로 인출을 돕는다. 철자는 주지 않는다.
 *   2단계 첫 글자 + 글자 수 — 철자 발판.
 *
 * blankedSentence 가 없는 문항(123건, 7.9%)은 1단계가 성립하지 않으므로 사다리가
 * 한 단계로 접히고, 그 한 단계가 첫 글자 + 글자 수가 된다. 읽기의
 * shouldShowKoreanHint 가 contextHint 없을 때 레벨을 당겨 받는 것과 같은 구조다.
 */

/** 예문 빈칸이 없으면 사다리가 1단계로 접힌다. */
export function getTypingMaxHintLevel(hasBlankedSentence: boolean): 1 | 2 {
  return hasBlankedSentence ? 2 : 1;
}

/** 1단계에서만 열린다. 예문이 없으면 영원히 닫혀 있다. */
export function shouldShowBlankedSentence(
  hintLevel: 0 | 1 | 2,
  hasBlankedSentence: boolean
): boolean {
  if (!hasBlankedSentence) {
    return false;
  }

  return hintLevel >= 1;
}

/**
 * 철자 발판. 예문이 있으면 2단계, 없으면 1단계로 당겨 받는다 —
 * 사다리가 접혔을 때 마지막 도움이 도달 불가능해지면 안 된다.
 */
export function shouldShowFirstLetter(
  hintLevel: 0 | 1 | 2,
  hasBlankedSentence: boolean
): boolean {
  return hintLevel >= getTypingMaxHintLevel(hasBlankedSentence);
}

/** "힌트 더 보기" 버튼의 표시 조건. */
export function canRequestMoreTypingHints(
  hintLevel: 0 | 1 | 2,
  hasBlankedSentence: boolean
): boolean {
  return hintLevel < getTypingMaxHintLevel(hasBlankedSentence);
}

/**
 * 읽기의 getHintButtonLabel 은 "전체 힌트 보기"(= 한국어 뜻 공개) 의미라 맞지 않는다.
 * 타이핑의 두 단계는 예문을 보는 것과 첫 글자를 보는 것이다.
 */
export function getTypingHintButtonLabel(
  hintLevel: 0 | 1 | 2,
  hasBlankedSentence: boolean
): string {
  if (hintLevel === 0 && hasBlankedSentence) {
    return "예문 보기";
  }

  return "첫 글자 보기";
}
