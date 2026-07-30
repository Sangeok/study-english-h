import type { ListeningQuestion, QuizQuestion } from "@/entities/question";
import type { GamificationResult } from "@/entities/gamification";

/**
 * 데일리 퀴즈 문항 — 읽기 | 리스닝 판별 유니온.
 *
 * 응답의 `type` 은 **필수**다. 서버가 항상 채우므로 소비처가 switch 로 남김없이 좁힐 수 있다.
 * 선택적으로 두면 type 없는 항목이 어느 case 에도 안 걸려 조용히 빠진다.
 *
 * 리스닝 arm 의 식별자 필드명이 `id` 인 것(값은 vocabularyId)이 중요하다 — 답안·힌트·타이머
 * 상태가 전부 question.id 로 키잉돼 있다. 이름이 vocabularyId 로 바뀌는 곳은 제출 body 뿐이다.
 */
export type DailyQuizItem =
  | ({ type: "reading" } & QuizQuestion)
  | ({ type: "listening" } & ListeningQuestion);

/**
 * 제출 답안 — 읽기 arm 에서만 `type` 이 선택적이다.
 *
 * 배포 순간 sessionStorage(quiz-answers-in-progress)에 남아 있던 옛 답안에는 type 이 없다.
 * 옛 답안은 정의상 읽기뿐이므로 "부재 = reading" 이 안전하다. 이 기본값 규칙은
 * normalize-quiz-item 한 곳에만 둔다 — 경계에서 한 번 정규화하면 하위 소비처는
 * 완전히 판별된 유니온만 본다.
 */
export interface ReadingSubmission {
  type?: "reading";
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;
}

export interface ListeningSubmission {
  type: "listening";
  vocabularyId: string;
  selectedMeaning: string;
  timeSpent: number;
  hintLevel: 0 | 1 | 2;
  /**
   * 오디오 재생 실패로 강등된 문항.
   *
   * 프리 힌트 대상에서 제외하기 위한 표시다 — selectFreeHintTargets 는 hintLevel 내림차순으로
   * 소비하므로, 강등(레벨 2)이 사용자가 직접 고른 힌트(레벨 1)를 앞지르고 구매한 아이템이
   * 네트워크 실패에 쓰인다. XP ×0.6 은 그대로 유지된다(철자를 본 사실은 변하지 않는다).
   *
   * 거짓으로 보내도 이득이 없다 — 프리 힌트가 소비되지 않아 XP 를 오히려 덜 받는다.
   */
  autoDegraded?: true;
}

export type QuizSubmission = ReadingSubmission | ListeningSubmission;

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation: string;
  sentenceAudioUrl?: string;
}

export interface QuizSummary {
  /** 읽기 + 듣기 **합계**. 사용자가 푼 문항 수와 같아야 한다(채점된 것 기준). */
  total: number;
  /** 읽기 + 듣기 정답 합계. */
  correct: number;
  accuracy: number;
  xpEarned: number;
  xpPenaltyFromHints: number; // route가 pre-compute (부스트 배수 반영된 값)
  hintStats: {
    noHintCorrect: number;
    partialHintCorrect: number;
    fullHintCorrect: number;
  };
  // 듣기 집계 — QuizSession 과 같은 어휘를 쓴다(...Total/...Count 가 섞이면 두 계약 대조가 헷갈린다).
  //   results[] 는 읽기 행만 담으므로 total 과 results.length 가 다른 수가 되는데, 이는 의도된 것이고
  //   그 차이를 이 두 값이 메운다("듣기 3문항 중 2정답").
  listeningCount: number;
  listeningCorrect: number;
  // 오답 편입 결과. null = 편입 실패(부분 편입 후 실패 포함), enrolledCount 0 = 편입 대상 없음.
  // features/flashcard 타입을 import 하지 않도록 구조를 인라인으로 둔다(동일 레이어 의존 회피).
  // SrsEnrollmentResult(features/flashcard/lib/srs-enrollment.ts)와 구조를 반드시 함께 바꾼다.
  srs: { enrolledCount: number } | null;
}

export interface DailyQuizResponse {
  questions: DailyQuizItem[];
  userLevel: string;
  totalQuestions: number;
  hasCompletedToday: boolean;
  // 서버가 내려주는 UserProfile.freeHintCount 스냅샷.
  // hasCompletedToday=true(추가 연습) 시에는 0으로 강제됨 — 이 경우 XP 미적립.
  freeHintCount: number;
}

export interface QuizSubmitResponse {
  results: QuizResult[];
  summary: QuizSummary;
  gamification?: GamificationResult;
  isExtraPractice: boolean;
  currentStreak: number;
}
