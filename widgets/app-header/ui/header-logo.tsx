import Link from "next/link";
import { ROUTES } from "@/shared/constants";

export function HeaderLogo() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
        <span className="text-lg font-bold text-white">E</span>
      </div>
      <span className="text-lg font-display font-bold text-purple-950 md:text-xl">EnglishFlow</span>
    </Link>
  );
}

