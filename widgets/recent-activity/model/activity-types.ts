export interface QuizActivity {
  date: string;
  type: "quiz";
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
}

export interface QualityCounts {
  easy: number;
  normal: number;
  hard: number;
  forgot: number;
}

export interface FlashcardActivity {
  date: string;
  type: "flashcard";
  mode: string;
  vocabularyCount: number;
  duration: number;
  qualityCounts: QualityCounts;
}

export type Activity = QuizActivity | FlashcardActivity;

export interface RecentActivityResponse {
  activities: Activity[];
  totalActivities: number;
}
