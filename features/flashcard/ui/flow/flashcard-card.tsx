import { cn } from "@/lib/utils";
import type { VocabularyCard } from "../../types";

interface FlashcardCardProps {
  card: VocabularyCard;
  isFlipped: boolean;
  onFlip: () => void;
  onPlayAudio: () => void;
}

export function FlashcardCard({ card, isFlipped, onFlip, onPlayAudio }: FlashcardCardProps) {
  return (
    <div className="max-w-2xl mx-auto perspective-1000">
      <div
        className={cn(
          "relative w-full h-[400px] transition-transform duration-600 transform-style-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={onFlip}
      >
        {/* Front Side - English Word */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center space-y-6 border-2 border-blue-100">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold text-gray-800">{card.word}</h1>
              {card.pronunciation && (
                <p className="text-xl text-gray-500">[{card.pronunciation}]</p>
              )}
              {card.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAudio();
                  }}
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold"
                >
                  🔊 발음 듣기
                </button>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-auto">카드를 클릭하여 뜻 보기</p>
          </div>
        </div>

        {/* Back Side - Korean Meaning */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center space-y-6 text-white">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">{card.meaning}</h2>
              {card.exampleSentence && (
                <p className="text-lg opacity-90 max-w-md">{card.exampleSentence}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
