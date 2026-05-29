import Link from "next/link";
import { ROUTES } from "@/shared/constants";

export function HeaderLogo() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center gap-3">
      <div className="tactile-tile h-9 w-9 bg-teal border-teal-edge" style={{ boxShadow: "0 3px 0 0 var(--teal-edge)" }}>
        <span className="font-display text-lg font-bold text-white">E</span>
      </div>
      <span className="text-lg font-display font-bold text-ink md:text-xl">EnglishFlow</span>
    </Link>
  );
}

