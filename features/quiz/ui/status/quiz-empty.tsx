interface QuizEmptyProps {
  onGoMain: () => void;
}

export function QuizEmpty({ onGoMain }: QuizEmptyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-950 mb-3">오늘의 퀴즈가 없어요</h2>
        <p className="text-purple-700 mb-8">내일 다시 돌아와주세요!</p>
        <button
          onClick={onGoMain}
          className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
