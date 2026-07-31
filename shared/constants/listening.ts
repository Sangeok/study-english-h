/**
 * 리스닝 모드 상수.
 *
 * DEFAULT_QUIZ_COUNT 가 shared/constants/quiz.ts 에 있고 daily 라우트가 그것과 나란히 쓰므로
 * 같은 층에 둔다.
 */

/**
 * 데일리 퀴즈 한 세션에 낼 리스닝 문항 수.
 *
 * 서버가 요청값을 이 값으로 상한 클램프한다 — 게이트 도입 후 클라이언트는 listening 을
 * 항상 명시해 보내므로 "기본값"만 0 으로 바꿔서는 기능이 꺼지지 않는다.
 * 이 상수를 0 으로 내리는 것이 배포 롤백 없는 킬 스위치다.
 */
export const LISTENING_QUESTION_COUNT = 3;

/**
 * 힌트 1단계의 재생 배속.
 *
 * playAudio 를 경유하지 않는다 — 그쪽 TTS 폴백은 정답 단어(text)를 요구하는데
 * 리스닝 클라이언트에는 그 값이 없고 있어서도 안 된다. 리스닝 컴포넌트가
 * new Audio(url).playbackRate 에 직접 넣는다.
 */
export const LISTENING_SLOW_PLAYBACK_RATE = 0.75;

/**
 * 읽기/듣기 갭을 화면에 내보내기 위한 최소 표본(listeningCount > 0 인 세션 수).
 * 미만이면 집계가 null 을 반환한다 — 표본 부족을 "갭 0" 으로 보여주지 않는다.
 */
export const LISTENING_GAP_MIN_SESSIONS = 10;

/**
 * 갭 집계가 볼 최근 세션 수의 상한.
 *
 * 창을 두지 않으면 초기의 나쁜 세션이 평균에 영구히 남아, 갭이 실제로 좁혀져도
 * 화면이 움직이지 않는다 — "갭이 닫히는 것을 본다"는 설계 전제가 깨진다.
 */
export const LISTENING_GAP_WINDOW = 30;
