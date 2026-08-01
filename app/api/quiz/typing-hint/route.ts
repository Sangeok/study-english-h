import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/shared/lib/get-session";

/**
 * POST /api/quiz/typing-hint
 *
 * 힌트 2단계의 철자 발판. body { vocabularyId } → 200 { firstLetter, length }.
 *
 * 클라이언트는 정답 철자를 모르므로 첫 글자·글자 수를 스스로 만들 수 없다. 그래서 별도
 * 엔드포인트가 필요하다 — 응답에 word 를 실으면 DevTools 로 정답을 읽을 수 있고,
 * 그러면 타이핑 문항이 아니게 된다.
 *
 * **전체 철자를 돌려주지 않는다.** 리스닝의 listening-hint 는 word 를 통째로 주지만
 * 그쪽은 철자가 힌트고 여기서는 철자가 답이다.
 *
 * 서버가 "2단계에서만" 을 강제하지는 못한다 — 데일리 퀴즈에 발급 기록이 없어
 * "그 문항이 당신에게 출제됐는가"를 확인할 수 없고 hintLevel 은 자기 신고다.
 * 유출되는 값이 첫 글자와 길이뿐이라 수용한다(P2-1 이 같은 취약점을 수용한 근거와 동일).
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

    const word = vocabulary.word.trim();

    return NextResponse.json({
      firstLetter: word.slice(0, 1),
      length: word.length,
    });
  } catch (error) {
    console.error("Typing hint error:", error);
    return NextResponse.json({ error: "힌트 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
