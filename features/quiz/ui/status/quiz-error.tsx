import { tactileButtonClass } from "@/shared/ui";

interface QuizErrorProps {
  onRetry: () => void;
}

export function QuizError({ onRetry }: QuizErrorProps) {
  return (
    <div className="min-h-screen bg-cream-canvas flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="tactile-tile w-20 h-20 bg-coral border-coral-edge mx-auto mb-6 text-4xl">
          <span>⚠️</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-ink mb-3">퀴즈를 불러올 수 없어요</h2>
        <p className="text-ink-soft mb-8">네트워크 연결을 확인하고 다시 시도해주세요.</p>
        <button onClick={onRetry} className={tactileButtonClass("coral", "lg")}>
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
