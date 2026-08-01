/**
 * 타이핑 채점 정규화.
 *
 * **오타는 오답이다.** 편집거리 허용을 두지 않는 이유는 짧은 단어에서 다른 단어가
 * 통과하기 때문이다 — land→lend · from→form · cut→cat 이 전부 거리 1 이고,
 * 어휘의 절반이 8자 이하다(중앙값 8).
 *
 * 흡수하는 것은 **키보드가 강제하는 것**뿐이다. 모바일 키보드는 입력 첫 글자를
 * 자동으로 대문자로 바꾸므로 Borrow 는 사용자 실수가 아니다.
 * (autocapitalize=none 으로 대부분 막히지만 일부 키보드는 무시한다.)
 *
 * 서버 채점과 테스트가 같은 함수를 쓴다 — 두 곳이 갈리면 "테스트는 통과하는데
 * 실제로는 틀리는" 상태가 된다.
 */
export function normalizeTypedAnswer(input: string): string {
  return input.toLowerCase().trim();
}

/** 입력이 정답 철자와 일치하는가. 양쪽 다 정규화한 뒤 완전 일치를 본다. */
export function isTypedAnswerCorrect(input: string, correctWord: string): boolean {
  const normalized = normalizeTypedAnswer(input);

  // 빈 입력은 정답이 될 수 없다 — 정답 단어가 빈 문자열인 경우까지 방어한다.
  if (normalized.length === 0) {
    return false;
  }

  return normalized === normalizeTypedAnswer(correctWord);
}
