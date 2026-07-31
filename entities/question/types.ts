import type { CefrLevel } from "@/shared/constants";

/** CEFR 난이도 레벨. shared/constants 의 CefrLevel(단일 출처)과 동일. */
export type QuestionDifficulty = CefrLevel;

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
  /**
   * 상황 설명 힌트 (DB 필드명: contextHintKo). hint level 1에서 표시.
   *
   * null 을 허용하는 이유: daily 라우트의 createQuizQuestionResponse 가
   * `contextHintKo ?? null` 을 내려보낸다. 응답을 타입에 묶는 순간(DailyQuizItem)
   * string|undefined 로는 받을 수 없다. 소비처는 이미 null 을 견딘다 —
   * quiz-hint-logic 의 술어들이 전부 `contextHint?: string | null` 시그니처다.
   */
  readonly contextHint?: string | null;
}

/**
 * 리스닝 문제 (단어 오디오 → 한국어 뜻 4지선다)
 *
 * BaseQuestion 을 상속하지 않는다 — sentence·koreanHint·difficulty·category 가 없다.
 *
 * id 는 세션 내 문항 식별자이고 그 값이 곧 vocabularyId 다. 답안·힌트·타이머 상태가
 * 전부 question.id 로 키잉돼 있어(use-quiz-answers·use-quiz-state·useQuizTimer)
 * 이 필드를 vocabularyId 로만 두면 그 셋이 통째로 깨진다. 이름이 vocabularyId 로
 * 바뀌는 곳은 제출 body 뿐이고, 그 리맵은 handleAnswer 한 곳에서만 일어난다.
 *
 * word(철자)·meaning(정답)은 담지 않는다 — 응답에 실리면 DevTools 로 정답을 읽을 수 있어
 * 리스닝 문항이 아니게 된다. 철자는 힌트 2단계에서 별도 엔드포인트로만 나간다.
 */
export interface ListeningQuestion {
  readonly id: string;
  readonly audioUrl: string;
  readonly options: readonly QuestionOption[];
}
