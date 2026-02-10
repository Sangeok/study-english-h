import { SectionWrapper } from "./section-wrapper";

interface FooterCTAProps {
  diagnosisCompleted: boolean;
  onQuizClick: () => void;
  onFlashcardClick: () => void;
}

export function FooterCTA({
  diagnosisCompleted,
  onQuizClick,
  onFlashcardClick
}: FooterCTAProps) {
  return (
    <SectionWrapper aria-label="학습 시작 안내">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl">
        <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
          레벨업 준비되셨나요?
        </h3>
        <p className="text-lg opacity-90 mb-8">
          지금 바로 학습을 시작하고 영어 실력을 향상시키세요
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onQuizClick}
            disabled={!diagnosisCompleted}
            className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            학습 시작하기
          </button>
          <button
            onClick={onFlashcardClick}
            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl hover:bg-white/30 transition-all duration-300"
          >
            플래시카드 학습
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
}
