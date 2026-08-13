/**
 * 진행 중 퀴즈 세션의 저장소.
 *
 * 저장소 접근을 이 모듈 하나에 가둔다 — 답안만 sessionStorage 에 남기던 옛 방식은
 * 문항이 재진입마다 새로 뽑히는 탓에 답안 키와 문항이 어긋났고, 그 상태에서
 * `answeredCount !== questions.length` 가 되어 제출 버튼이 영영 열리지 않았다.
 * 문항·답안·진행 인덱스를 **한 스냅샷으로 함께** 저장하는 것이 그 결함의 뿌리를 없앤다.
 *
 * 패턴은 features/diagnosis/lib/guest-diagnosis-storage.ts 를 따른다 —
 * 버전 리터럴 + zod 검증 + 판별 가능한 결과 타입.
 */
import { z } from "zod";
import { questionCategorySchema } from "@/entities/question/lib/schemas";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import { toKSTDateString } from "@/entities/user/lib/streak";
import type { DailyQuizResponse } from "../types";

export const QUIZ_SESSION_STORAGE_KEY = "quiz-session-in-progress";

const QUIZ_SESSION_SCHEMA_VERSION = 1 as const;

const hintLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const questionOptionSchema = z.object({ text: z.string() });

/**
 * DailyQuizItem(../types) 유니온을 그대로 반영한다.
 * 서버 응답을 그대로 저장하므로 arm 이 어긋나면 복원이 조용히 깨진다.
 *
 * **options 의 .readonly() 는 장식이 아니다.** BaseQuestion·ListeningQuestion 의 options 는
 * `readonly QuestionOption[]` 이고(entities/question/types.ts), readonly 배열은 가변 배열에
 * 할당할 수 없다 — 빼면 saveQuizSession 호출부가 컴파일되지 않는다.
 * 바깥 questions 배열은 가변으로 둔다: DailyQuizResponse.questions 가 가변이다.
 */
const dailyQuizItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reading"),
    id: z.string(),
    koreanHint: z.string(),
    contextHint: z.string().nullable().optional(),
    sentence: z.string(),
    difficulty: cefrLevelSchema,
    category: questionCategorySchema,
    options: z.array(questionOptionSchema).readonly(),
  }),
  z.object({
    type: z.literal("listening"),
    id: z.string(),
    audioUrl: z.string(),
    options: z.array(questionOptionSchema).readonly(),
  }),
  z.object({
    type: z.literal("typing"),
    id: z.string(),
    meaning: z.string(),
    audioUrl: z.string(),
    blankedSentence: z.string().optional(),
  }),
]);

/**
 * 제출 답안.
 *
 * 읽기 arm 의 `type` 은 QuizSubmission 과 **똑같이 optional** 이어야 한다(../types).
 * 필수로 두면 추론 타입이 원본보다 좁아져 `Record<string, QuizSubmission>` 을
 * saveQuizSession 에 넘길 수 없다. 판별자가 optional 이면 discriminatedUnion 을 쓸 수 없어
 * union 이다 — arm 마다 필수 필드가 겹치지 않아 순차 매칭으로도 오분류가 없다.
 */
const quizSubmissionSchema = z.union([
  z.object({
    type: z.literal("reading").optional(),
    questionId: z.string(),
    selectedAnswer: z.string(),
    timeSpent: z.number(),
    hintLevel: hintLevelSchema,
  }),
  z.object({
    type: z.literal("listening"),
    vocabularyId: z.string(),
    selectedMeaning: z.string(),
    timeSpent: z.number(),
    hintLevel: hintLevelSchema,
    autoDegraded: z.literal(true).optional(),
  }),
  z.object({
    type: z.literal("typing"),
    vocabularyId: z.string(),
    typedAnswer: z.string(),
    audioPlayed: z.boolean(),
    timeSpent: z.number(),
    hintLevel: hintLevelSchema,
  }),
]);

const quizSessionSnapshotSchema = z.object({
  schemaVersion: z.literal(QUIZ_SESSION_SCHEMA_VERSION),
  /**
   * **마지막 저장 시점**의 KST 날짜(YYYY-MM-DD). 폐기의 유일한 기준이다.
   *
   * 발급 시점이 아니라 저장 시점인 것이 중요하다 — 23:50에 시작해 자정을 넘겨 계속 푸는
   * 세션은 매 저장마다 날짜가 갱신되어 살아남는다. 발급 시점으로 고정하면 풀던 도중
   * 자정에 세션이 끊긴다. 폐기 대상은 "하루가 지나도록 손대지 않은 세션"이다.
   */
  kstDate: z.string(),
  /** 이 세션이 발급된 게이트 값. 복원 시 쿼리 키를 이 값으로 만든다. */
  listeningEnabled: z.boolean(),
  userLevel: z.string(),
  hasCompletedToday: z.boolean(),
  freeHintCount: z.number(),
  questions: z.array(dailyQuizItemSchema).min(1),
  answers: z.record(z.string(), quizSubmissionSchema),
  hintLevels: z.record(z.string(), hintLevelSchema),
  /** 재생 실패로 강등된 문항 · 발음을 재생한 타이핑 문항. 제출 shape 에 실린다. */
  degradedIds: z.array(z.string()),
  audioPlayedIds: z.array(z.string()),
  currentIndex: z.number().int().min(0),
});

export type QuizSessionSnapshot = z.infer<typeof quizSessionSnapshotSchema>;

export type QuizSessionSnapshotInput = Omit<
  QuizSessionSnapshot,
  "schemaVersion" | "kstDate"
>;

export type QuizSessionReadResult =
  | { status: "ready"; session: QuizSessionSnapshot }
  | { status: "empty" }
  | { status: "expired" }
  | { status: "invalid" }
  | { status: "unavailable" };

export type QuizSessionMutationResult = { status: "success" } | { status: "unavailable" };

/**
 * 답안·힌트·ref 키를 문항 집합 안으로 가둔다.
 *
 * zod 는 모양만 본다 — 답안 키가 문항에 실재하는지는 검증하지 않는다. 그 불변식이 깨진
 * 상태가 정확히 제출 불가 stuck 이므로, 스키마만으로는 재발을 막지 못한다.
 */
function pruneToQuestions(session: QuizSessionSnapshot): QuizSessionSnapshot {
  const ids = new Set(session.questions.map((question) => question.id));
  const keep = <T>(record: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(record).filter(([id]) => ids.has(id)));

  return {
    ...session,
    answers: keep(session.answers),
    hintLevels: keep(session.hintLevels),
    degradedIds: session.degradedIds.filter((id) => ids.has(id)),
    audioPlayedIds: session.audioPlayedIds.filter((id) => ids.has(id)),
    // 인덱스도 여기서 맞춘다 — useQuizNavigation 의 clampIndex 가 이중 방어로 남지만,
    //   저장소가 내보내는 값 자체가 유효한 편이 소비처를 신뢰할 수 있게 만든다.
    currentIndex: Math.min(session.currentIndex, session.questions.length - 1),
  };
}

/**
 * 검증 없이 직렬화해 쓴다.
 *
 * 입력이 이미 타입으로 좁혀져 있고, 이 함수는 키 입력 한 번마다 호출된다 —
 * 그 경로에 zod 파싱을 얹을 이유가 없다. 저장된 값이 어떤 이유로든 계약을 벗어나면
 * readQuizSession 이 invalid 로 잡아 지우므로 손상된 스냅샷은 화면까지 도달하지 않는다.
 */
export function saveQuizSession(
  session: QuizSessionSnapshotInput,
  now: Date = new Date()
): QuizSessionMutationResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  const snapshot: QuizSessionSnapshot = {
    schemaVersion: QUIZ_SESSION_SCHEMA_VERSION,
    kstDate: toKSTDateString(now),
    ...session,
  };

  try {
    window.localStorage.setItem(QUIZ_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
    return { status: "success" };
  } catch {
    return { status: "unavailable" };
  }
}

/**
 * 날짜가 지났거나 파싱·검증에 실패하면 **지우고** 그 사유를 반환한다.
 *
 * guest-diagnosis-storage 는 invalid 를 남기지만(진단 결과는 디버깅 가치가 있다),
 * 진행 중 세션은 되살릴 수 없고 남겨두면 매 진입마다 같은 실패를 반복한다.
 */
export function readQuizSession(now: Date = new Date()): QuizSessionReadResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(QUIZ_SESSION_STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }

  if (raw === null) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearQuizSession();
    return { status: "invalid" };
  }

  const validation = quizSessionSnapshotSchema.safeParse(parsed);
  if (!validation.success) {
    clearQuizSession();
    return { status: "invalid" };
  }

  if (validation.data.kstDate !== toKSTDateString(now)) {
    clearQuizSession();
    return { status: "expired" };
  }

  return { status: "ready", session: pruneToQuestions(validation.data) };
}

export function clearQuizSession(): QuizSessionMutationResult {
  if (typeof window === "undefined") return { status: "unavailable" };

  try {
    window.localStorage.removeItem(QUIZ_SESSION_STORAGE_KEY);
    return { status: "success" };
  } catch {
    return { status: "unavailable" };
  }
}

/**
 * 스냅샷을 daily 응답 모양으로 바꾼다 — useDailyQuiz 의 initialData 로 그대로 들어간다.
 * 스냅샷 필드를 아는 유일한 모듈이 이 파일이므로 변환도 여기 둔다.
 */
export function toDailyQuizResponse(session: QuizSessionSnapshot): DailyQuizResponse {
  return {
    questions: session.questions,
    userLevel: session.userLevel,
    // 스냅샷에 따로 저장하지 않는다 — 문항 배열이 유일한 출처다.
    totalQuestions: session.questions.length,
    hasCompletedToday: session.hasCompletedToday,
    freeHintCount: session.freeHintCount,
  };
}
