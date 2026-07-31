import prisma from "@/lib/db";
import { LISTENING_GAP_MIN_SESSIONS, LISTENING_GAP_WINDOW } from "@/shared/constants";

/**
 * 읽기 대비 듣기 갭.
 *
 * 듣기 정답률 단독으로는 62% 가 좋은지 나쁜지 알 수 없고, 세션당 3문항이라 추이 그래프는
 * 0·33·67·100 네 값으로만 튄다. 캐스케이드가 **같은 단어**를 읽기·듣기로 각각 재므로
 * 두 정답률의 차이가 공정한 비교가 되고, 그 차이가 줄어드는 것이 곧 듣기 향상이다.
 */
export interface ListeningGap {
  /** 창 안 세션의 읽기 정답률(%) */
  readonly readingRate: number;
  /** 창 안 세션의 듣기 정답률(%) */
  readonly listeningRate: number;
  /** readingRate - listeningRate. 음수면 듣기가 읽기를 앞선 것이다. */
  readonly gap: number;
}

function rate(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/**
 * 집계 범위는 두 겹이다.
 *
 *   1) listeningCount > 0 인 세션만 — 오디오 토글로 끈 날은 듣기 실력의 표본이 아니다.
 *   2) 그중 createdAt desc 로 최근 LISTENING_GAP_WINDOW 건까지만 — 창이 없으면 초기의
 *      나쁜 세션이 평균에 영구히 남아, 갭이 실제로 좁혀져도 화면이 움직이지 않는다.
 *      "갭이 닫히는 것을 본다"는 설계 전제가 그 순간 깨진다.
 *
 * 창 안의 세션이 LISTENING_GAP_MIN_SESSIONS 미만이면 null 을 돌려준다.
 * null 은 **표본 부족**이지 "갭 0" 이 아니다 — 호출부는 이걸 0 으로 렌더하면 안 된다.
 */
export async function getListeningGap(userId: string): Promise<ListeningGap | null> {
  const sessions = await prisma.quizSession.findMany({
    where: { userId, listeningCount: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: LISTENING_GAP_WINDOW,
    select: {
      readingCount: true,
      readingCorrect: true,
      listeningCount: true,
      listeningCorrect: true,
    },
  });

  if (sessions.length < LISTENING_GAP_MIN_SESSIONS) {
    return null;
  }

  let readingCount = 0;
  let readingCorrect = 0;
  let listeningCount = 0;
  let listeningCorrect = 0;

  for (const session of sessions) {
    readingCount += session.readingCount;
    readingCorrect += session.readingCorrect;
    listeningCount += session.listeningCount;
    listeningCorrect += session.listeningCorrect;
  }

  const readingRate = rate(readingCorrect, readingCount);
  const listeningRate = rate(listeningCorrect, listeningCount);

  return { readingRate, listeningRate, gap: readingRate - listeningRate };
}
