import Link from "next/link";
import { ROUTES } from "@/shared/constants";

interface ReviewNeededBannerProps {
  count: number;
}

export function ReviewNeededBanner({ count }: ReviewNeededBannerProps) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-yellow-800 mb-1">
            복습이 필요한 단어가 {count}개 있습니다
          </h3>
          <p className="text-sm text-yellow-700">
            지금 복습하고 기억을 강화하세요!
          </p>
        </div>
        <Link
          href={ROUTES.FLASHCARD_MODES}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          복습 시작
        </Link>
      </div>
    </div>
  );
}
