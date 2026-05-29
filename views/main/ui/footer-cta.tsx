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
      <div
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] border-2 border-teal-edge bg-teal p-12 text-center text-white"
        style={{ boxShadow: "0 6px 0 0 var(--teal-edge), 0 30px 50px -28px rgba(18,184,134,0.7)" }}
      >
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative z-10">
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
              className="tactile-btn tactile-btn--gold tactile-btn--lg"
            >
              학습 시작하기
            </button>
            <button
              onClick={onFlashcardClick}
              className="tactile-btn tactile-btn--lg border-white/40 bg-white/15 text-white"
              style={{ boxShadow: "0 4px 0 0 rgba(255,255,255,0.25)" }}
            >
              플래시카드 학습
            </button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
