/**
 * Flashcard Main Page
 *
 * 3D flip card interface for vocabulary learning with progressive difficulty ratings
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useFlashcardSession,
  useFlashcardReview,
  useFlashcardTimer,
  type ReviewEntry,
  type ReviewQuality,
} from "@/features/flashcard";

function FlashcardContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") || "review") as "review" | "new";

  const { data, isLoading, error } = useFlashcardSession(mode);
  const reviewMutation = useFlashcardReview();
  const { startCardTimer, getCardTime, getSessionDuration, resetSessionTimer } = useFlashcardTimer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  // Initialize timer on mount
  useEffect(() => {
    resetSessionTimer();
    startCardTimer();
  }, []);

  // Reset card when index changes
  useEffect(() => {
    setIsFlipped(false);
    startCardTimer();
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">플래시카드를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-2xl">❌</p>
          <h2 className="text-xl font-bold text-gray-800">오류 발생</h2>
          <p className="text-gray-600">플래시카드를 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.vocabularies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-4xl">📚</p>
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === "review" ? "복습할 단어가 없습니다" : "새로운 단어가 없습니다"}
          </h2>
          <p className="text-gray-600">
            {mode === "review" ? "새로운 단어를 학습해보세요!" : "복습할 단어를 확인해보세요!"}
          </p>
          <button
            onClick={() => (window.location.href = `/flashcard?mode=${mode === "review" ? "new" : "review"}`)}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
          >
            {mode === "review" ? "새로운 단어 학습하기" : "복습하기"}
          </button>
        </div>
      </div>
    );
  }

  const cards = data.vocabularies;
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality: ReviewQuality) => {
    const timeSpent = getCardTime();
    const isCorrect = quality !== "forgot";

    const review: ReviewEntry = {
      vocabularyId: currentCard.id,
      quality,
      isCorrect,
      timeSpent,
    };

    const updatedReviews = [...reviews, review];

    if (currentIndex < cards.length - 1) {
      // Move to next card
      setReviews(updatedReviews);
      setCurrentIndex((i) => i + 1);
    } else {
      // Submit all reviews
      const duration = getSessionDuration();
      reviewMutation.mutate({
        reviews: updatedReviews,
        mode: "flashcard",
        duration,
      });
    }
  };

  const playAudio = () => {
    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl);
      audio.play().catch(() => alert("오디오 재생에 실패했습니다."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard Container */}
      <div className="max-w-2xl mx-auto perspective-1000">
        <div
          className={`relative w-full h-[400px] transition-transform duration-600 transform-style-3d cursor-pointer ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={handleFlip}
        >
          {/* Front Side - English Word */}
          <div className="absolute w-full h-full backface-hidden">
            <div className="w-full h-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center space-y-6 border-2 border-blue-100">
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold text-gray-800">{currentCard.word}</h1>
                {currentCard.pronunciation && (
                  <p className="text-xl text-gray-500">[{currentCard.pronunciation}]</p>
                )}
                {currentCard.audioUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio();
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
                <h2 className="text-4xl font-bold">{currentCard.meaning}</h2>
                {currentCard.exampleSentence && (
                  <p className="text-lg opacity-90 max-w-md">{currentCard.exampleSentence}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Buttons (only show when flipped) */}
      {isFlipped && (
        <div className="max-w-2xl mx-auto mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            onClick={() => handleReview("forgot")}
            disabled={reviewMutation.isPending}
            className="px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105"
          >
            모르겠어요<br />
            <span className="text-xs opacity-80">Again</span>
          </button>
          <button
            onClick={() => handleReview("hard")}
            disabled={reviewMutation.isPending}
            className="px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105"
          >
            어려워요<br />
            <span className="text-xs opacity-80">Hard</span>
          </button>
          <button
            onClick={() => handleReview("normal")}
            disabled={reviewMutation.isPending}
            className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105"
          >
            괜찮아요<br />
            <span className="text-xs opacity-80">Good</span>
          </button>
          <button
            onClick={() => handleReview("easy")}
            disabled={reviewMutation.isPending}
            className="px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105"
          >
            쉬워요<br />
            <span className="text-xs opacity-80">Easy</span>
          </button>
        </div>
      )}

      {/* Mastery Level Badge */}
      <div className="max-w-2xl mx-auto mt-6 text-center">
        <span
          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
            currentCard.masteryLevel === "new"
              ? "bg-gray-200 text-gray-700"
              : currentCard.masteryLevel === "learning"
              ? "bg-yellow-200 text-yellow-800"
              : currentCard.masteryLevel === "reviewing"
              ? "bg-blue-200 text-blue-800"
              : "bg-green-200 text-green-800"
          }`}
        >
          {currentCard.masteryLevel === "new"
            ? "🆕 새로운 단어"
            : currentCard.masteryLevel === "learning"
            ? "📖 학습 중"
            : currentCard.masteryLevel === "reviewing"
            ? "🔄 복습 중"
            : "✨ 숙달"}
        </span>
      </div>

      {/* CSS for 3D flip animation */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transition-transform {
          transition: transform 0.6s;
        }
        .duration-600 {
          transition-duration: 0.6s;
        }
      `}</style>
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <FlashcardContent />
    </Suspense>
  );
}
