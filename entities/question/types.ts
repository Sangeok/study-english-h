export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface DiagnosisQuestion {
  id: string;
  koreanHint: string;
  englishWord: string;
  sentence: string;
  difficulty: string;
  category: string;
  options: QuestionOption[];
}

export interface DiagnosisAnswer {
  questionId: string;
  difficulty: string;
  isCorrect: boolean;
  category: string;
}

export interface QuizQuestion {
  id: string;
  koreanHint: string;
  contextHint?: string;
  sentence: string;
  difficulty: string;
  category: string;
  options: QuestionOption[];
}
