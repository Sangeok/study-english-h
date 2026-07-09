export function QuizLoading() {
  return (
    <div className="min-h-screen bg-chamber flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-chamber-line" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cobalt-lt animate-spin" />
        </div>
        <h2 className="text-2xl font-display font-bold text-chamber-ink mb-2">오늘의 퀴즈 준비 중</h2>
        <p className="text-chamber-soft">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
