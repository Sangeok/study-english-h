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
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 text-green-800 text-sm font-semibold mb-4">
      <span>🎉</span>
      <span>오늘 학습 완료!</span>
    </div>
  );
}

function ExtraPracticeBanner() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-semibold mb-4">
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
      <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mb-6 shadow-2xl animate-bounce-gentle">
        <span className="text-6xl">{performance.emoji}</span>
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-purple-950 mb-3">
        {performance.title}
      </h1>
      <p className="text-lg md:text-xl text-purple-700">{performance.message}</p>
    </div>
  );
}
