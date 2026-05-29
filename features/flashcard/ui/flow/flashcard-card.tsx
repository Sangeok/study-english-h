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
        {/* Front Side — English word, cream physical card */}
        <div className="absolute w-full h-full backface-hidden">
          <div
            className="relative h-full w-full overflow-hidden rounded-[28px] border-2 border-border-strong bg-paper p-8 flex flex-col items-center justify-center"
            style={{ boxShadow: "0 6px 0 0 var(--border-strong), 0 28px 44px -28px rgba(60,42,28,0.35)" }}
          >
            <span
              className="pointer-events-none absolute -right-3 -top-3 select-none text-7xl opacity-10"
              aria-hidden
            >
              🃏
            </span>
            <div className="absolute left-6 top-6 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">
              WORD
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="font-display text-5xl font-bold tracking-tight text-ink md:text-6xl">
                {card.word}
              </h1>
              {card.pronunciation && (
                <p className="font-display text-xl text-ink-soft">[{card.pronunciation}]</p>
              )}
              {card.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAudio();
                  }}
                  className="tactile-btn tactile-btn--ocean tactile-btn--sm"
                >
                  🔊 발음 듣기
                </button>
              )}
            </div>

            <p className="absolute bottom-6 left-0 right-0 text-center text-sm font-medium text-ink-soft">
              카드를 탭하여 뜻 보기 👆
            </p>
          </div>
        </div>

        {/* Back Side — Korean meaning, teal solid hero face */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div
            className="relative h-full w-full overflow-hidden rounded-[28px] border-2 border-teal-edge bg-teal p-8 flex flex-col items-center justify-center text-white"
            style={{ boxShadow: "0 6px 0 0 var(--teal-edge), 0 28px 44px -26px rgba(18,184,134,0.55)" }}
          >
            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" aria-hidden />
            <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-white/10" aria-hidden />
            <div className="absolute left-6 top-6 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Meaning
            </div>

            <div className="relative flex flex-col items-center gap-5 text-center">
              <h2 className="text-4xl font-bold leading-snug">{card.meaning}</h2>
              {card.exampleSentence && (
                <p className="max-w-md rounded-2xl border-2 border-white/25 bg-white/15 px-4 py-3 text-base font-medium text-white/95">
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
