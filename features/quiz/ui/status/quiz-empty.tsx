import { tactileButtonClass } from "@/shared/ui";

interface QuizEmptyProps {
  onGoMain: () => void;
}

export function QuizEmpty({ onGoMain }: QuizEmptyProps) {
  return (
    <div className="min-h-screen bg-chamber flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-display font-bold text-chamber-ink mb-3">오늘의 퀴즈가 없어요</h2>
        <p className="text-chamber-soft mb-8">내일 다시 만나요.</p>
        <button onClick={onGoMain} className={tactileButtonClass("teal", "lg")}>
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
