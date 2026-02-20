export interface QuizSubmission {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation: string;
}

export interface QuizSummary {
  total: number;
  correct: number;
  accuracy: number;
  xpEarned: number;
  correctBaseXP: number;
  hintStats: {
    noHintCorrect: number;
    partialHintCorrect: number;
    fullHintCorrect: number;
  };
}

export interface QuizSubmitResponse {
  results: QuizResult[];
  summary: QuizSummary;
}

