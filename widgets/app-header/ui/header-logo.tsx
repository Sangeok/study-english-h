import Link from "next/link";
import { ROUTES } from "@/shared/constants";

export function HeaderLogo() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center">
      <span className="font-display text-lg font-extrabold tracking-tight text-chamber-ink md:text-xl">
        Study<span className="text-cobalt-lt">English</span>
      </span>
    </Link>
  );
}

