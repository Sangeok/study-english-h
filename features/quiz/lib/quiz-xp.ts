// features/quiz/lib/quiz-xp.ts
// 퀴즈 힌트 시스템 XP 계산 유틸리티

export const QUIZ_HINT_XP_MULTIPLIER = {
  0: 1.0,   // 힌트 없이 정답: 10 XP (100%)
  1: 0.9,   // 상황 힌트 사용: 9 XP (90%)
  2: 0.6,   // 전체 힌트 사용: 6 XP (60%)
} as const;

export const BASE_XP_PER_QUESTION = 10;

/**
 * 문제당 XP 계산
 * @param isCorrect - 정답 여부
 * @param hintLevel - 사용한 힌트 레벨 (0: 없음, 1: 상황, 2: 전체)
 * @returns 획득한 XP
 */
export function calculateQuestionXP(isCorrect: boolean, hintLevel: 0 | 1 | 2): number {
  if (!isCorrect) return 0;
  return Math.floor(BASE_XP_PER_QUESTION * QUIZ_HINT_XP_MULTIPLIER[hintLevel]);
}
