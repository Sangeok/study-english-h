import { toKSTDateString } from "./streak";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * 복습 하루가 시작되는 KST 시각.
 *
 * **자정이 아닌 이유**: `interval` 은 일 단위인데 `nextReviewDate` 는 학습 시각을 그대로
 * 보존한다(srs-algorithm.ts 의 `addDays`). 컷오프를 자정으로 잡으면 23:50 에 학습한 카드가
 * 10분 뒤에 다시 도래한다. 04:00 은 그 즉시 재도래를 막으면서 "다음날 아침이면 열린다"를
 * 만족하는 값이다(Anki 의 롤오버와 같은 개념).
 *
 * **스트릭과 경계가 다르다**: 스트릭은 KST 자정 기준이다(streak.ts 의 getTodayKSTRange).
 * 두 경계는 의도적으로 다르다 — 스트릭은 "며칠 연속 학습했는가"라는 달력 개념이고,
 * 복습 도래는 "하루치 학습 세션"이라는 생활 주기 개념이다. 일관성을 이유로 통일하지 말 것.
 */
export const REVIEW_ROLLOVER_HOUR = 4;

/**
 * "복습 도래" Prisma 필터를 만든다 — `where: { nextReviewDate: getReviewDueFilter(now) }`.
 *
 * 저장된 `nextReviewDate` 는 학습 시각을 보존하므로(예: 21:00 학습 → 다음날 21:00),
 * `lte: now` 로 조회하면 **어제 학습한 시각이 될 때까지 그 카드가 잠긴다**. 아침에 접속한
 * 사용자는 도래한 카드를 못 보고, 학습 시각이 조금씩 밀리면 자정을 넘어 하루를 건너뛴다.
 * 그래서 시점 비교가 아니라 **"오늘 안에 도래하는가"** 로 자른다.
 *
 * 이 술어는 다섯 곳이 공유한다. 하나만 바꾸면 화면끼리 조용히 어긋난다:
 *   - features/flashcard/lib/srs-service.ts (복습 세션 카드)
 *   - entities/user/api/get-vocabulary-stats.ts (화면의 "복습 N개")
 *   - entities/user/api/get-level-progress.ts (진행률 페널티 D)
 *   - app/api/quiz/daily/route.ts ×2 (리스닝 캐스케이드 1단계)
 * 뒤의 셋은 **시간 조건만 공유하고 레벨 스코프는 리스닝만 갖는다** — 레벨 필터를
 * "일관성"을 이유로 지우거나 넣지 말 것.
 *
 * @param now - 주입 가능한 기준 시각(streak.ts·get-vocabulary-stats.ts 관례)
 */
export function getReviewDueFilter(now: Date = new Date()): { lt: Date } {
  // now 를 롤오버만큼 되감으면 "몇 시에 접속했든 오늘이 며칠인가"가 나온다.
  // 03:00 접속은 전날로, 04:00 접속은 당일로 떨어진다.
  const studyDay = toKSTDateString(new Date(now.getTime() - REVIEW_ROLLOVER_HOUR * MS_PER_HOUR));
  const hh = String(REVIEW_ROLLOVER_HOUR).padStart(2, "0");
  const dayStart = new Date(`${studyDay}T${hh}:00:00+09:00`);

  // KST 는 DST 가 없으므로 +24h 가 곧 다음 롤오버다.
  return { lt: new Date(dayStart.getTime() + MS_PER_DAY) };
}
