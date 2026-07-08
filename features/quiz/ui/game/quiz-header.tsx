interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  userLevel: string;
}

/** 챔버 상단 바 — 문항 수만큼의 세그먼트 진행바 + 레벨 칩 */
export function QuizHeader({ currentIndex, totalQuestions, answeredCount, userLevel }: QuizHeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 px-4 pb-2 pt-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <div
            className="flex flex-1 gap-1.5"
            role="img"
            aria-label={`진행도: ${totalQuestions}문제 중 ${currentIndex + 1}번째, ${answeredCount}문제 완료`}
          >
            {Array.from({ length: totalQuestions }, (_, i) => (
              <i
                key={i}
                className={[
                  "h-[5px] flex-1 rounded-full",
                  i < currentIndex
                    ? "bg-cobalt-lt"
                    : i === currentIndex
                      ? "bg-cobalt-lt shadow-[0_0_10px_rgba(110,155,255,0.7)]"
                      : "bg-[#1b2a44]",
                ].join(" ")}
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-chamber-line px-3 py-1.5 text-xs font-bold text-chamber-soft">
            {userLevel} 맞춤
          </span>
        </div>
      </div>
    </div>
  );
}
