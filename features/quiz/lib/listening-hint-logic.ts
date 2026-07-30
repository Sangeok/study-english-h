/**
 * 리스닝 전용 힌트 사다리.
 *
 * quiz-hint-logic.ts 를 쓰지 않는다 — 그쪽 술어 넷(getMaxHintLevel·shouldShowContextHint·
 * shouldShowKoreanHint·canRequestMoreHints)은 전부 contextHint 를 보는데 리스닝 문항에는
 * contextHint 가 없어 사다리가 1단계로 접힌다.
 *
 * 특히 canRequestMoreHints 는 "힌트 더 보기" 버튼의 표시 조건이라, 그것만 재사용해도
 * 훅이 2단계를 허용하는지와 무관하게 사용자가 요청할 방법이 사라진다. 결함이 두 층에 있다.
 *
 * 그래서 전 함수가 무인자이거나 hintLevel 만 받는다 — contextHint 를 받을 수 있게 두면
 * 읽기 사다리와 혼동돼 같은 결함이 되살아난다.
 */

/** 리스닝은 데이터에 의존하지 않는다 — 항상 2단계까지 열린다. */
export function getListeningMaxHintLevel(): 2 {
  return 2;
}

/** 1단계: 느린 배속 재생. */
export function shouldPlaySlowly(hintLevel: 0 | 1 | 2): boolean {
  return hintLevel >= 1;
}

/** 2단계: 철자 노출. 재생 실패 시의 자동 강등도 이 레벨로 온다. */
export function shouldShowSpelling(hintLevel: 0 | 1 | 2): boolean {
  return hintLevel >= 2;
}

/** "힌트 더 보기" 버튼의 표시 조건. */
export function canRequestMoreListeningHints(hintLevel: 0 | 1 | 2): boolean {
  return hintLevel < getListeningMaxHintLevel();
}

/**
 * 읽기의 getHintButtonLabel 은 "전체 힌트 보기"(= 한국어 뜻 공개) 의미라 리스닝에 맞지 않는다.
 * 리스닝의 두 단계는 소리를 늦추는 것과 철자를 여는 것이다.
 */
export function getListeningHintButtonLabel(hintLevel: 0 | 1 | 2): string {
  return hintLevel === 0 ? "느리게 듣기" : "철자 보기";
}
