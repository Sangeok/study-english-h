import { NextResponse } from "next/server";
import { getListeningGap } from "@/entities/user/api/get-listening-gap";
import { getSessionFromRequest } from "@/shared/lib/get-session";

/**
 * GET /api/dashboard/listening-gap
 *
 * 읽기/듣기 갭 리더의 전송 경계. 대시보드는 "use client" 라 prisma 리더를 직접 부를 수 없다 —
 * 이 라우트가 없으면 클라이언트 번들에 prisma 가 딸려 들어간다.
 *
 * userId 는 **세션에서만** 얻는다. 쿼리 파라미터로 받으면 남의 학습 통계를 조회할 수 있다.
 *
 * 계약: 200 { readingRate, listeningRate, gap } | { gap: null } · 401 미인증
 *   표본 부족은 오류가 아니라 정상 응답이다 — 클라이언트가 렌더를 건너뛴다.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const gap = await getListeningGap(session.user.id);

    return NextResponse.json(gap ?? { gap: null });
  } catch (error) {
    console.error("Listening gap error:", error);
    return NextResponse.json({ error: "듣기 갭 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
