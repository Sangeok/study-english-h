interface PerformanceMessage {
  emoji: string;
  title: string;
  message: string;
}

interface QuizFeedbackHeaderProps {
  performance: PerformanceMessage;
}

export function QuizFeedbackHeader({ performance }: QuizFeedbackHeaderProps) {
  return (
    <div className="text-center mb-12 animate-fade-in">
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
