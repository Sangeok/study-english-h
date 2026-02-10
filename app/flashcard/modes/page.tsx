/**
 * Study Mode Selection Page
 *
 * Displays available study modes for vocabulary learning
 */

"use client";

import { useRouter } from "next/navigation";

interface ModeCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route: string;
  available: boolean;
}

const modes: ModeCard[] = [
  {
    id: "flashcard",
    emoji: "🃏",
    title: "플래시카드",
    description: "앞뒤로 넘기며 학습",
    route: "/flashcard?mode=review",
    available: true,
  },
  {
    id: "matching",
    emoji: "🔗",
    title: "매칭",
    description: "한글 뜻과 영어 단어 짝맞추기",
    route: "/flashcard/matching",
    available: false, // Phase 4
  },
  {
    id: "choice",
    emoji: "✅",
    title: "선택형",
    description: "4개 선택지에서 정답 선택",
    route: "/flashcard/choice",
    available: false, // Phase 4
  },
  {
    id: "typing",
    emoji: "⌨️",
    title: "타이핑",
    description: "영어 단어 직접 입력",
    route: "/flashcard/typing",
    available: false, // Phase 4
  },
  {
    id: "listening",
    emoji: "🎧",
    title: "리스닝",
    description: "영어 발음 듣고 선택",
    route: "/flashcard/listening",
    available: false, // Phase 4
  },
];

export default function ModesPage() {
  const router = useRouter();

  const handleModeClick = (mode: ModeCard) => {
    if (mode.available) {
      router.push(mode.route);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">학습 모드 선택</h1>
          <p className="text-gray-600">다양한 방식으로 단어를 학습하세요!</p>
        </div>

        {/* Mode Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              disabled={!mode.available}
              className={`relative p-8 rounded-2xl shadow-lg transition-all duration-300 ${
                mode.available
                  ? "bg-white hover:scale-105 hover:shadow-2xl cursor-pointer"
                  : "bg-gray-100 opacity-60 cursor-not-allowed"
              }`}
            >
              {/* Coming Soon Badge */}
              {!mode.available && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                  준비 중
                </div>
              )}

              <div className="text-center space-y-4">
                <p className="text-6xl">{mode.emoji}</p>
                <h3 className="text-xl font-bold text-gray-800">{mode.title}</h3>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center pt-8">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold shadow-md transition-all hover:scale-105"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* Info Section */}
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 학습 팁</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>매일 꾸준히 복습하면 장기 기억에 효과적입니다</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>다양한 학습 모드를 번갈아 사용하면 더 재미있게 학습할 수 있습니다</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>어려운 단어는 여러 번 반복하여 학습하세요</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
