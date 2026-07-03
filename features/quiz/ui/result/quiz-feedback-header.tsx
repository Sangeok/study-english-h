interface PerformanceMessage {
  emoji: string;
  title: string;
  message: string;
}

interface QuizFeedbackHeaderProps {
  performance: PerformanceMessage;
  isExtraPractice: boolean;
}

function CompletionBanner() {
  return (
    <div className="tactile-chip mb-4 border-teal bg-teal-tint text-teal-edge">
      <span>🎉</span>
      <span>오늘 학습 완료!</span>
    </div>
  );
}

function ExtraPracticeBanner() {
  return (
    <div className="tactile-chip mb-4 border-ocean bg-ocean-tint text-ink">
      <span>✅</span>
      <span>추가 연습 완료 — XP는 첫 번째 완료 시에만 적립됩니다</span>
    </div>
  );
}

export function QuizFeedbackHeader({ performance, isExtraPractice }: QuizFeedbackHeaderProps) {
  return (
    <div className="text-center mb-12 animate-fade-in">
      {isExtraPractice && <ExtraPracticeBanner />}
      {!isExtraPractice && <CompletionBanner />}
      <div
        className="inline-flex items-center justify-center w-28 h-28 bg-teal border-2 border-teal-edge rounded-full mb-6 animate-bounce-gentle"
        style={{ boxShadow: "0 6px 0 0 var(--teal-edge), 0 20px 34px -18px rgba(18,184,134,.7)" }}
      >
        <span className="text-6xl">{performance.emoji}</span>
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-ink mb-3">
        {performance.title}
      </h1>
      <p className="text-lg md:text-xl text-ink-soft">{performance.message}</p>
    </div>
  );
}
