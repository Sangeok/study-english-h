import { cn } from "@/lib/utils";
import type { KeyboardEvent } from "react";
import type { VocabularyCard } from "../../types";

interface FlashcardCardProps {
  card: VocabularyCard;
  isFlipped: boolean;
  onFlip: () => void;
  onPlayAudio: () => void;
}

export function FlashcardCard({ card, isFlipped, onFlip, onPlayAudio }: FlashcardCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onFlip();
  };

  return (
    <div className="max-w-2xl mx-auto perspective-1000">
      <div
        className={cn(
          "relative w-full h-[400px] transition-transform duration-600 transform-style-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        role="button"
        tabIndex={0}
        aria-label="플래시카드 뒤집기"
        aria-pressed={isFlipped}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
      >
        {/* Front Side — English word on chamber panel */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-chamber-line bg-chamber-panel p-8 flex flex-col items-center justify-center shadow-[0_28px_44px_-28px_rgba(0,0,0,0.6)]">
            <div className="absolute left-6 top-6 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-chamber-soft">
              WORD
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="font-display text-5xl font-bold tracking-tight text-chamber-ink md:text-6xl">
                {card.word}
              </h1>
              {card.pronunciation && (
                <p className="font-display text-xl text-chamber-soft">[{card.pronunciation}]</p>
              )}
              {card.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAudio();
                  }}
                  className="tactile-btn tactile-btn--ghost tactile-btn--sm border-chamber-line text-chamber-soft hover:border-chamber-soft hover:text-chamber-ink"
                >
                  발음 듣기
                </button>
              )}
            </div>

            <p className="absolute bottom-6 left-0 right-0 text-center text-sm font-medium text-chamber-soft">
              카드를 탭하면 뜻이 보여요
            </p>
          </div>
        </div>

        {/* Back Side — Korean meaning, cobalt solid hero face */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-teal p-8 flex flex-col items-center justify-center text-white shadow-[0_28px_44px_-26px_rgba(46,107,255,0.5)]">
            <div className="absolute left-6 top-6 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Meaning
            </div>

            <div className="relative flex flex-col items-center gap-5 text-center">
              <h2 className="text-4xl font-bold leading-snug">{card.meaning}</h2>
              {card.exampleSentence && (
                <p className="max-w-md rounded-2xl bg-white/12 px-4 py-3 text-base font-medium text-white/95">
                  {card.exampleSentence}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
