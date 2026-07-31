import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";

/**
 * POST /api/quiz/listening-hint
 *
 * 힌트 2단계의 철자 조회. body { vocabularyId } → 200 { word }.
 *
 * 철자를 데일리 응답에 실어 보내지 않는 이유가 이 라우트의 존재 이유다 — 응답에 word 가 있으면
 * DevTools 로 정답을 읽을 수 있고, 그러면 리스닝 문항이 아니다.
 *
 * **서버가 "2단계에서만" 을 강제하지는 못한다.** 데일리 퀴즈에는 발급 기록이 없어(승급 시험의
 * LevelPromotionSession 같은 세션 모델이 없다) "그 문항이 당신에게 출제됐는가"를 확인할 방법이
 * 없고, hintLevel 은 클라이언트 자기 신고다. 수용하는 이유:
 *   (a) 같은 취약점이 읽기에 이미 있다 — koreanHint·contextHint 가 데일리 응답에 통째로 실린다.
 *   (b) 유출되는 값이 어휘 철자라 플래시카드에서도 보이는 공개 콘텐츠다.
 *   (c) 막으려면 발급 세션 모델이 필요한데 v1 범위를 크게 넘는다.
 * 재검토 트리거: XP·리그 보상이 실질 가치를 갖게 될 때.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = (await req.json()) as { vocabularyId?: unknown };

    if (typeof body?.vocabularyId !== "string" || body.vocabularyId.length === 0) {
      return NextResponse.json({ error: "vocabularyId가 필요합니다" }, { status: 400 });
    }

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: body.vocabularyId },
      select: { word: true },
    });

    if (!vocabulary) {
      return NextResponse.json({ error: "단어를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ word: vocabulary.word });
  } catch (error) {
    console.error("Listening hint error:", error);
    return NextResponse.json({ error: "힌트 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
