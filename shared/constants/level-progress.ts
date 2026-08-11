/**
 * 레벨 진행률 산식·승급 시험 상수 — P4 단일 출처.
 * 산식 근거는 docs/plans/plan-cefr-progress-and-promotion-test.md §4-1.
 * 순수 숫자 상수만 둔다(클라이언트 배럴 노출 안전).
 */
export const LEVEL_PROGRESS = {
  MATURITY_WEIGHT: 0.6,
  ACCURACY_WEIGHT: 0.4,
  /** A 만점 기준: 완전 마스터 100단어 상당의 성숙 점수 합 */
  TARGET_WORD_UNITS: 100,
  /** B 집계 창: 현재 레벨 최근 시도 수.
   *  **B 는 "최근 *읽기* 정답률"이다** — 창에 들어오는 것은 UserQuizAttempt 행뿐이고,
   *  리스닝 문항은 그 테이블에 기록되지 않는다(questionId 가 QuizQuestion 에 대한
   *  non-nullable FK). 이름이 "정답률"이라 전체 정답률로 오해되기 쉬워 여기 적어둔다.
   *  리스닝 비율을 3에서 올리면 B 의 표본이 줄어 오차가 커지므로 그때 정의를 다시 판단한다. */
  ACCURACY_WINDOW: 50,
  /** B 볼륨 감쇠 기준 — 이 미만이면 시도수 비례로 감쇠 */
  ACCURACY_MIN_VOLUME: 20,
  /** B 만점 기준 정답률(%) — 진단 GOOD 임계(accuracy-thresholds.ts)와 같은 값.
   *  entities 가 features/diagnosis/config 를 임포트할 수 없어(FSD 상향 금지) 값을 미러링한다.
   *  진단 임계를 바꾸면 여기도 함께 바꿀 것. */
  ACCURACY_FULL_MARK: 80,
  /** D 상한(%p) — 도래 비율이 100% 일 때의 페널티 */
  MAX_REVIEW_DEBT_PENALTY: 15,
  /** D 볼륨 감쇠 기준 — 보유 단어가 이 미만이면 보유 수 비례로 감쇠.
   *  3단어 중 3개 도래가 곧바로 최대 페널티가 되면 초기 사용자에게 과하다.
   *  B 성분의 ACCURACY_MIN_VOLUME 과 같은 방식이며 값도 맞춘다. */
  DEBT_MIN_VOLUME: 20,
} as const;

/** masteryLevel 문자열 키 — new 0 · learning 1/3 · reviewing 2/3 · mastered 1.
 *  값 타입을 `number | undefined` 로 둔다: noUncheckedIndexedAccess 가 off 라
 *  `Record<string, number>` 였다면 인덱스 접근이 `number` 로 잡혀 소비처의 `?? 0` 가드가
 *  죽은 코드로 오인·제거될 수 있다(그러면 미지 키 → undefined*count = NaN → stats JSON 이 null 로
 *  직렬화되는 조용한 진행바 버그). undefined 를 타입에 노출해 가드를 정당화한다.
 *  entities 는 features/flashcard 의 MasteryLevel 타입을 import 못 해 문자열 키를 쓴다
 *  (get-vocabulary-stats.ts 의 "mastered" 문자열 비교 선례). MasteryLevel 에 단계 추가 시 여기도 갱신. */
export const MASTERY_SCORE: Record<string, number | undefined> = {
  new: 0,
  learning: 1 / 3,
  reviewing: 2 / 3,
  mastered: 1,
};

export const PROMOTION = {
  QUESTION_COUNT: 10,
  PASS_COUNT: 8,
  RETRY_COOLDOWN_DAYS: 3,
  /** 응시 세션 유효 시간(분). 만료 세션은 제출에서 거부된다 —
   *  10문항 응시에 충분하면서, 발급만 받아 두고 뒤에 쓰는 것을 막는 상한. */
  SESSION_TTL_MINUTES: 30,
} as const;
