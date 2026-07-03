/** CEFR 難易度レベル。entities/user の CefrLevel と同一の値域。 */
export type QuestionDifficulty = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** 問題カテゴリ。DB の category カラム値に対応。 */
export type QuestionCategory = "daily" | "business" | "toeic" | "travel" | "idioms";

/**
 * 問題選択肢
 *
 * 참고: DB의 `order` 및 `isCorrect` 필드는 API 경계에서 제거되며 entity 타입에 노출되지 않음.
 * 정렬은 응답 시점 셔플로 처리되며, 정답 판정은 서버에서 DB 재조회로 수행한다.
 */
export interface QuestionOption {
  readonly text: string;
}

/**
 * 클라이언트 → 서버 와이어 타입 (진단 제출 payload 의 단일 답변)
 *
 * difficulty · category · isCorrect 를 의도적으로 담지 않는다.
 * 클라이언트가 주장할 수 있는 면적을 최소화해 가중치 조작 우회 경로를 원천 차단한다.
 */
export interface DiagnosisSubmitAnswer {
  readonly questionId: string;
  readonly selectedText: string;
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
 * 진단은 실력을 변별하는 평가이므로 도움/정답 노출 요소를 클라이언트에 내려보내지 않는다.
 * - koreanHint(한국어 뜻): 제외 — 일반 퀴즈에선 단계별 유료 힌트로 쓰이는 도움 요소
 * - englishWord(정답 단어): 제외 — 채점은 서버가 DB 재조회로 수행하므로 불필요한 정답 누출
 *
 * @see features/diagnosis — 진단 플로우 구현
 */
export type DiagnosisQuestion = Omit<BaseQuestion, "koreanHint">;

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
