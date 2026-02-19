import { ROUTES } from "@/shared/constants";

export interface HeaderNavItem {
  href: string;
  label: string;
}

export const HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { href: ROUTES.DIAGNOSIS, label: "레벨 진단" },
  { href: ROUTES.QUIZ, label: "일일 퀴즈" },
  { href: ROUTES.FLASHCARD_MODES, label: "플래시카드" },
];

