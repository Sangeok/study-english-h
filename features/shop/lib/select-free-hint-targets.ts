interface HintedAnswer {
  questionId: string;
  hintLevel: 0 | 1 | 2;
  isCorrect: boolean;
}

/**
 * 정답이면서 힌트를 사용한 답변 중 프리 힌트를 적용할 대상 ID 집합을 반환한다.
 *
 * 전략: 페널티가 큰 답변부터 우선 적용 (사용자 이익 최대화).
 *   hintLevel 2 (0.6x, 4 XP 손실) → hintLevel 1 (0.9x, 1 XP 손실) 순.
 *
 * 반환된 Set에 포함된 questionId는 XP 계산 시 effectiveHintLevel=0으로 처리한다.
 * 소비된 프리 힌트 수는 반환 Set의 size로 자연 도출된다.
 */
export function selectFreeHintTargets(
  answers: HintedAnswer[],
  availableFreeHints: number
): Set<string> {
  if (availableFreeHints <= 0) return new Set();

  const targets = answers
    .filter((a) => a.isCorrect && a.hintLevel > 0)
    .sort((a, b) => b.hintLevel - a.hintLevel)
    .slice(0, availableFreeHints)
    .map((a) => a.questionId);

  return new Set(targets);
}
