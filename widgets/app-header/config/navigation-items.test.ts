import { describe, expect, it } from "vitest";

import { ROUTES } from "@/shared/constants";
import { HEADER_NAV_ITEMS } from "./navigation-items";

describe("HEADER_NAV_ITEMS", () => {
  // 사용자가 "복습"을 찾을 수 있어야 한다 — 형식 이름("플래시카드")은 목적을 말하지 않는다(CONTEXT.md).
  it("복습을 목적 이름으로 노출하고 세션에 직행한다", () => {
    expect(HEADER_NAV_ITEMS).toContainEqual({
      href: ROUTES.FLASHCARD_REVIEW,
      label: "복습",
    });
  });

  // 5개 중 4개가 "준비 중"인 형식 선택 화면은 진입점에서 링크하지 않는다(ADR 0002).
  it("형식 선택(모드) 화면을 링크하지 않는다", () => {
    const hrefs = HEADER_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).not.toContain(ROUTES.FLASHCARD_MODES);
  });
});
