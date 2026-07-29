export const ACCURACY_THRESHOLDS = {
  CRITICAL: 40,
  WEAK: 60,
  // GOOD 은 P4 승급의 기준점이기도 하다 — shared/constants/level-progress.ts 의 ACCURACY_FULL_MARK 와
  // PROMOTION.PASS_COUNT(=QUESTION_COUNT 의 80%)가 이 값을 미러링한다. 바꾸면 그 둘도 함께 바꿀 것
  // (FSD 상 entities→diagnosis import 불가라 컴파일러가 못 잡는다 — 미러링 불변식 테스트가 대신 강제:
  //  entities/user/lib/level-progress.test.ts).
  GOOD: 80,
} as const;
