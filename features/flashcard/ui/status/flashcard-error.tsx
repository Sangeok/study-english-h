interface FlashcardErrorProps {
  onRetry: () => void;
}

export function FlashcardError({ onRetry }: FlashcardErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <p className="text-2xl">❌</p>
        <h2 className="text-xl font-bold text-gray-800">오류 발생</h2>
        <p className="text-gray-600">플래시카드를 불러올 수 없습니다.</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
