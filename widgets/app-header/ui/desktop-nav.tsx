import Link from "next/link";
import { cn } from "@/lib/utils";
import { HEADER_NAV_ITEMS } from "../config/navigation-items";

interface DesktopNavProps {
  pathname: string;
}

export function DesktopNav({ pathname }: DesktopNavProps) {
  return (
    <nav className="hidden items-center gap-2 lg:flex" aria-label="주요 메뉴">
      {HEADER_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              isActive && "bg-purple-100 text-purple-900",
              !isActive && "text-purple-700 hover:bg-purple-50 hover:text-purple-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

