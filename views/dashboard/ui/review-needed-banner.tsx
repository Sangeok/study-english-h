import Link from "next/link";
import { Bell } from "lucide-react";
import { ROUTES } from "@/shared/constants";
import { tactileButtonClass } from "@/shared/ui";

interface ReviewNeededBannerProps {
  count: number;
}

export function ReviewNeededBanner({ count }: ReviewNeededBannerProps) {
  return (
    <div className="tactile-card p-6 mb-8 border-gold bg-gold-tint">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="tactile-tile w-12 h-12 shrink-0 bg-gold border-gold-edge text-ink">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ink mb-1">
              복습이 필요한 단어가 {count}개 있습니다
            </h3>
            <p className="text-sm text-ink-soft">지금 복습하면 기억이 오래가요</p>
          </div>
        </div>
        <Link href={ROUTES.FLASHCARD_MODES} className={tactileButtonClass("gold")}>
          복습 시작
        </Link>
      </div>
    </div>
  );
}
