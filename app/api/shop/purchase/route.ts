import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { purchaseItem } from "@/features/shop/lib/purchase-item";
import { isPrismaCheckConstraintError } from "@/features/shop/lib/prisma-errors";

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_XP: "XP가 부족합니다",
  MAX_OWNED: "최대 보유 수량에 도달했습니다",
  ITEM_NOT_FOUND: "존재하지 않는 아이템입니다",
  PROFILE_NOT_FOUND: "사용자 프로필을 찾을 수 없습니다",
};

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { itemCode?: string };
    if (!body.itemCode) {
      return NextResponse.json(
        { error: "아이템 코드가 필요합니다", code: "ITEM_NOT_FOUND" },
        { status: 400 }
      );
    }

    const result = await purchaseItem(session.user.id, body.itemCode);

    if (!result.success) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES[result.error ?? ""] ?? "구매에 실패했습니다",
          code: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newSpendableXP: result.newSpendableXP,
      message: result.message,
    });
  } catch (error) {
    // DB CHECK 제약조건 위반 — 동시 요청으로 인한 XP 부족
    if (isPrismaCheckConstraintError(error)) {
      return NextResponse.json(
        { error: "XP가 부족합니다", code: "INSUFFICIENT_XP" },
        { status: 400 }
      );
    }
    console.error("Shop purchase error:", error);
    return NextResponse.json(
      { error: "구매 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
