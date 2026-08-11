/**
 * 세션 학습 시간을 한국어 문구로 포맷한다.
 *
 * 1분 미만은 초만, 그 이상은 "N분 M초"로 보여준다. 0초 이하(또는 유효하지 않은 값)는
 * 결과 화면이 빈칸을 띄우지 않도록 "0초"로 떨어뜨린다.
 */
export function formatSessionDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0초";
  }

  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}초`;
  }

  if (remainder === 0) {
    return `${minutes}분`;
  }

  return `${minutes}분 ${remainder}초`;
}
