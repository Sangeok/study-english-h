import { tactileButtonClass } from "@/shared/ui";

interface QuizEmptyProps {
  onGoMain: () => void;
}

export function QuizEmpty({ onGoMain }: QuizEmptyProps) {
  return (
    <div className="min-h-screen bg-cream-canvas flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="tactile-tile w-20 h-20 bg-teal border-teal-edge mx-auto mb-6 text-4xl">
          <span>📝</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-ink mb-3">오늘의 퀴즈가 없어요</h2>
        <p className="text-ink-soft mb-8">내일 다시 돌아와주세요!</p>
        <button onClick={onGoMain} className={tactileButtonClass("teal", "lg")}>
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
