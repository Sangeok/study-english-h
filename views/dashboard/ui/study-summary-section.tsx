interface StudySummarySectionProps {
  period: string;
  totalQuizzes: number;
  quizAccuracy: number;
  quizStudyTimeSec: number;
  totalFlashcardSessions: number;
  flashcardStudyTimeSec: number;
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)}분`;
}

const PERIOD_PREFIX: Record<string, string> = {
  day: "오늘",
  week: "이번 주",
  month: "이번 달",
  all: "최근 3개월",
};

function getPeriodPrefix(period: string): string {
  return PERIOD_PREFIX[period] ?? "이번 주";
}

export function StudySummarySection({
  period,
  totalQuizzes,
  quizAccuracy,
  quizStudyTimeSec,
  totalFlashcardSessions,
  flashcardStudyTimeSec,
}: StudySummarySectionProps) {
  const prefix = getPeriodPrefix(period);

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold text-purple-950 mb-4">{prefix} 퀴즈 통계</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">완료한 퀴즈</span>
            <span className="font-bold">{totalQuizzes}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">정확도</span>
            <span className="font-bold text-green-600">{quizAccuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">퀴즈 학습 시간</span>
            <span className="font-bold">{formatMinutes(quizStudyTimeSec)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-bold text-purple-950 mb-4">{prefix} 플래시카드 통계</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">학습 세션</span>
            <span className="font-bold">{totalFlashcardSessions}회</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">플래시카드 학습 시간</span>
            <span className="font-bold">{formatMinutes(flashcardStudyTimeSec)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
