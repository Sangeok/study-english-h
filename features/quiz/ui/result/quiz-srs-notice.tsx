import { Layers } from "lucide-react";
import type { QuizSummary } from "../../types";

interface QuizSrsNoticeProps {
  srs: QuizSummary["srs"];
  onGoReview: () => void;
}

export function QuizSrsNotice({ srs, onGoReview }: QuizSrsNoticeProps) {
  // null(편입 실패)과 0건(오답 없음/전부 미연결)은 동일하게 숨김 — 실패를 사용자 오류로 보이지 않게 한다
  if (!srs || srs.enrolledCount === 0) return null;

  return (
    <section
      aria-label="복습 편입 안내"
      className="mb-8 animate-slide-up"
      style={{ animationDelay: "0.35s" }}
    >
      <div className="tactile-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="tactile-tile w-12 h-12 bg-gold border-gold-edge text-white">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">복습 목록</h3>
            {/* 편입 단어는 interval 1일 — 오늘 복습 세션이 아니라 내일 도래한다 */}
            <p className="text-sm text-ink-soft">내일부터 다시 만나요</p>
          </div>
        </div>

        <div className="p-4 bg-gold-tint rounded-2xl border border-gold mb-6">
          <p className="text-sm text-ink text-center">
            틀린 단어{" "}
            <span className="text-gold-edge font-display font-bold tabular-nums text-base">
              {srs.enrolledCount}개
            </span>
            가 복습에 추가되었어요
          </p>
        </div>

        <button
          type="button"
          onClick={onGoReview}
          className="tactile-btn tactile-btn--gold tactile-btn--block"
        >
          <span>복습하러 가기</span>
        </button>
      </div>
    </section>
  );
}
