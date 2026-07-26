import { ROUTES } from "@/shared/constants";

export interface HeaderNavItem {
  href: string;
  label: string;
}

export const HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { href: ROUTES.DIAGNOSIS, label: "레벨 진단" },
  { href: ROUTES.QUIZ, label: "일일 퀴즈" },
  // "플래시카드"는 형식 이름이라 무엇을 하는지 말하지 않는다 — 목적(복습)으로 부른다(CONTEXT.md).
  { href: ROUTES.FLASHCARD_REVIEW, label: "복습" },
  { href: ROUTES.DASHBOARD, label: "대시보드" },
  { href: ROUTES.SHOP, label: "상점" },
];

