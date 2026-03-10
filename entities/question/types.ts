/** CEFR 難易度レベル。entities/user の CefrLevel と同一の値域。 */
export type QuestionDifficulty = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** 問題カテゴリ。DB の category カラム値に対応。 */
export type QuestionCategory = "daily" | "business" | "toeic" | "travel" | "idioms";

/**
 * 問題選択肢
 *
 * 참고: DB의 `order` 필드는 API 경계에서 제거되며 entity 타입에 노출되지 않음.
 * 정렬은 DB 쿼리(orderBy: { order: "asc" })에서 처리된다.
 */
export interface QuestionOption {
  readonly text: string;
  readonly isCorrect: boolean;
}

interface BaseQuestion {
  readonly id: string;
  readonly koreanHint: string;
  readonly sentence: string;
  readonly difficulty: QuestionDifficulty;
  readonly category: QuestionCategory;
  readonly options: readonly QuestionOption[];
}

/**
 * 레벨 진단용 문제
 *
 * @see features/diagnosis — 진단 플로우 구현
 */
export interface DiagnosisQuestion extends BaseQuestion {
  /** 정답 영어 단어. 진단에서만 사용 (퀴즈는 options로 정답 판단) */
  readonly englishWord: string;
}

export interface DiagnosisAnswer {
  readonly questionId: string;
  readonly difficulty: QuestionDifficulty;
  readonly isCorrect: boolean;
  readonly category: QuestionCategory;
}

/**
 * 일반 퀴즈용 문제
 *
 * @see features/quiz — 퀴즈 플로우 구현
 */
export interface QuizQuestion extends BaseQuestion {
  /** 상황 설명 힌트 (DB 필드명: contextHintKo). hint level 1에서 표시 */
  readonly contextHint?: string;
}
