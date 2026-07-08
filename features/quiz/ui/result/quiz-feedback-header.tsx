interface PerformanceMessage {
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
      <span>오늘 학습 완료</span>
    </div>
  );
}

function ExtraPracticeBanner() {
  return (
    <div className="tactile-chip mb-4 border-ocean bg-ocean-tint text-ink">
      <span>추가 연습 완료 — XP는 첫 번째 완료 시에만 적립됩니다</span>
    </div>
  );
}

export function QuizFeedbackHeader({ performance, isExtraPractice }: QuizFeedbackHeaderProps) {
  return (
    <div className="text-center mb-12 animate-fade-in">
      {isExtraPractice && <ExtraPracticeBanner />}
      {!isExtraPractice && <CompletionBanner />}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-ink mb-3 tracking-tight">
        {performance.title}
      </h1>
      <p className="text-lg md:text-xl text-ink-soft">{performance.message}</p>
    </div>
  );
}
