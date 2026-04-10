export interface DailyStudyStat {
  date: string; // YYYY-MM-DD (KST)
  quizCount: number;
  flashcardSessions: number;
  totalStudyTimeSec: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface PeriodStatsResponse {
  totalQuizzes: number;
  quizAccuracy: number; // 0-100 정수
  quizStudyTimeSec: number; // 퀴즈 전용 학습 시간 (초)
  totalFlashcardSessions: number;
  flashcardStudyTimeSec: number; // 플래시카드 전용 학습 시간 (초)
  totalStudyTimeSec: number; // 퀴즈 + 플래시카드 합계 (초)
  dailyStats: DailyStudyStat[];
  categoryStats: CategoryStat[];
}
