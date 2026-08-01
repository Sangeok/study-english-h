import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { QuestionCategory, QuestionDifficulty } from "@/entities/question";
import { questionCategorySchema } from "@/entities/question/lib/schemas";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import {
  DEFAULT_QUIZ_COUNT,
  WEAKNESS_QUESTION_RATIO,
  RECENT_EXCLUSION_RATIO,
  RECENT_EXCLUSION_MAX,
  LISTENING_QUESTION_COUNT,
  TYPING_QUESTION_COUNT,
} from "@/shared/constants";
import {
  buildListeningQuestions,
  selectListeningWords,
  type ListeningCandidate,
  type ListeningDraft,
} from "@/features/quiz/lib/listening-selection";
import {
  buildTypingQuestions,
  collectUsedWords,
  selectTypingWords,
  type TypingCandidate,
  type TypingDraft,
} from "@/features/quiz/lib/typing-selection";
import type { DailyQuizItem } from "@/features/quiz/types";
import { checkDiagnosisStatus } from "@/shared/lib/diagnosis-guards";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import { shuffleArray } from "@/shared/lib";
import { getTodayKSTRange } from "@/entities/user/lib/streak";

const QUESTION_INCLUDE = {
  options: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.QuizQuestionInclude;

type QuizQuestionWithOptions = Prisma.QuizQuestionGetPayload<{
  include: typeof QUESTION_INCLUDE;
}>;

type QuestionQueryOptions = {
  difficulty: QuestionDifficulty;
  take: number;
  includeCategories?: readonly QuestionCategory[];
  excludeCategories?: readonly QuestionCategory[];
  excludeQuestionIds?: readonly string[];
};

function getQuizCount(searchParams: URLSearchParams): number {
  const rawCount = searchParams.get("count");

  if (!rawCount) {
    return DEFAULT_QUIZ_COUNT;
  }

  const parsedCount = Number(rawCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    return DEFAULT_QUIZ_COUNT;
  }

  return parsedCount;
}

/**
 * listening 파라미터 파싱. **getQuizCount 를 재사용하면 안 된다** — 그 함수는 0 을 오류값으로
 * 보고 DEFAULT_QUIZ_COUNT 로 바꾼다. 여기서 0 은 "듣기를 빼 달라"는 유효한 요청이다.
 *
 * 상한 클램프가 킬 스위치다: 게이트 도입 후 클라이언트는 listening 을 항상 명시해 보내므로
 * 서버 "기본값"만 0 으로 바꿔서는 기능이 꺼지지 않는다. min(요청값, LISTENING_QUESTION_COUNT)
 * 이어야 상수 한 줄로 끌 수 있다.
 *
 * count - 1 상한은 장식이 아니다 — 읽기 문항이 최소 1개 남아야 UserQuizAttempt 행이 생겨
 * 그날 데일리 완료 판정이 산다(리스닝은 그 테이블에 기록되지 않는다).
 */
function getListeningCount(searchParams: URLSearchParams, count: number): number {
  const ceiling = Math.max(0, Math.min(LISTENING_QUESTION_COUNT, count - 1));
  const raw = searchParams.get("listening");

  // "0" 은 truthy 문자열이라 ?? 로는 걸러지지 않는다. 반드시 Number 변환 후 검사한다.
  if (raw === null) {
    return ceiling;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return ceiling;
  }

  return Math.min(parsed, ceiling);
}

function getUserLevel(level: string | null | undefined): QuestionDifficulty {
  const result = cefrLevelSchema.safeParse(level);

  if (!result.success) {
    return "A1";
  }

  return result.data;
}

function getWeaknessCategories(weaknessAreas: unknown): QuestionCategory[] {
  if (!isPlainObject(weaknessAreas)) {
    return [];
  }

  return Object.keys(weaknessAreas).flatMap((category) => {
    const result = questionCategorySchema.safeParse(category);

    if (!result.success) {
      return [];
    }

    return [result.data];
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Fix 1: 콘텐츠 기반 중복 제거 — DB에 동일 englishWord가 다른 ID로 중복 저장된 경우 방어
function deduplicateByContent(
  questions: QuizQuestionWithOptions[],
  alreadyUsedWords: ReadonlySet<string> = new Set()
): QuizQuestionWithOptions[] {
  // seed 로 리스닝 단어를 넣으면 같은 englishWord 를 가진 읽기 후보가 자동 탈락한다 —
  //   유형 간 중복은 한쪽 문항이 다른 쪽의 정답을 그대로 보여주는 결함이다.
  const seen = new Set<string>(alreadyUsedWords);
  return questions.filter((q) => {
    if (seen.has(q.englishWord)) return false;
    seen.add(q.englishWord);
    return true;
  });
}

// Fix 3: take 제한 제거 — 전체 후보 조회 후 JS 셔플로 편향 없는 랜덤화
async function getRandomQuestions({
  difficulty,
  take,
  includeCategories,
  excludeCategories,
  excludeQuestionIds,
}: QuestionQueryOptions): Promise<QuizQuestionWithOptions[]> {
  if (take <= 0) {
    return [];
  }

  const questions = await prisma.quizQuestion.findMany({
    where: {
      difficulty,
      ...(includeCategories && includeCategories.length > 0
        ? {
            category: {
              in: [...includeCategories],
            },
          }
        : {}),
      ...(excludeCategories && excludeCategories.length > 0
        ? {
            category: {
              notIn: [...excludeCategories],
            },
          }
        : {}),
      ...(excludeQuestionIds && excludeQuestionIds.length > 0
        ? {
            id: {
              notIn: [...excludeQuestionIds],
            },
          }
        : {}),
    },
    include: QUESTION_INCLUDE,
  });

  return shuffleArray(questions).slice(0, take);
}

/** 읽기 항목의 모양을 만드는 유일한 자리 — type 판별자도 여기서 채운다.
 *  호출부에서 스프레드로 붙이면 판별자가 여러 곳으로 흩어진다. */
function createQuizQuestionResponse(question: QuizQuestionWithOptions): DailyQuizItem {
  return {
    type: "reading",
    id: question.id,
    koreanHint: question.koreanHint,
    contextHint: question.contextHintKo ?? null,
    sentence: question.sentence,
    difficulty: question.difficulty,
    category: question.category,
    // Phase 0-A: isCorrect 제거 — 클라이언트에 정답 노출 차단
    // Phase 0-B: shuffleArray 로 응답 시점 셔플 — position 암기 exploit 차단
    options: shuffleArray(question.options).map((option) => ({
      text: option.text,
    })),
  };
}


/**
 * 리스닝 문항 선정 — 캐스케이드 3단계 조회 + 오답 조합.
 *
 * **읽기보다 먼저 뽑는다.** 읽기 문항 수가 count - 뽑힌리스닝수 로 정해지기 때문이다.
 * 그래서 이 시점에 "세션 읽기 단어"는 아직 존재하지 않고, 유형 간 중복 배제는 반대 방향에서
 * 건다 — 읽기 후보를 deduplicateByContent 에 리스닝 단어를 seed 로 넣어 거른다.
 * (계획 §4-2 는 캐스케이드가 읽기 단어를 배제한다고 썼지만, 그 순서로는 순환이 된다.)
 *
 * 레벨은 라우트가 계산한 userLevel 을 그대로 받는다 — profile?.level 원값을 따로 읽으면
 * 스키마 검증 실패 시 읽기(A1 폴백)와 리스닝의 레벨이 갈린다.
 */
async function selectListeningDrafts(
  userId: string,
  level: QuestionDifficulty,
  count: number,
  now: Date = new Date()
): Promise<(ListeningDraft & { word: string })[]> {
  if (count <= 0) {
    return [];
  }

  const vocabularySelect = { id: true, word: true, meaning: true, audioUrl: true };
  // audioUrl ≠ null 을 세 단계 모두에 건다 — 빠뜨리면 재생할 것이 없는 문항이 실린다.
  const audible = { level, audioUrl: { not: null } };

  const [dueRows, enrolledRows, poolRows] = await Promise.all([
    // 1) 도래 — 시간 조건(lte: now)의 형태는 진행률 페널티 D·화면의 "복습 N개"와 같지만,
    //    그 둘은 레벨을 가리지 않는다. 여기는 레벨 스코프를 자기 것으로 갖는다.
    prisma.userVocabulary.findMany({
      where: { userId, nextReviewDate: { lte: now }, vocabulary: audible },
      orderBy: { nextReviewDate: "asc" },
      take: count * 4,
      select: { vocabulary: { select: vocabularySelect } },
    }),
    // 2) 편입됨
    prisma.userVocabulary.findMany({
      where: { userId, vocabulary: audible },
      take: count * 8,
      select: { vocabulary: { select: vocabularySelect } },
    }),
    // 3) 레벨 무작위 + 오답 보기 풀. 레벨당 250건이라 전체 조회 후 JS 셔플이 편향 없이 싸다
    //    (읽기 문항의 getRandomQuestions 와 같은 방식).
    prisma.vocabulary.findMany({ where: audible, select: vocabularySelect }),
  ]);

  const toCandidates = (
    rows: { id: string; word: string; meaning: string; audioUrl: string | null }[]
  ): ListeningCandidate[] =>
    rows.flatMap((row) =>
      row.audioUrl
        ? [{ id: row.id, word: row.word, meaning: row.meaning, audioUrl: row.audioUrl }]
        : []
    );

  const pool = toCandidates(poolRows);
  const answers = selectListeningWords({
    due: toCandidates(dueRows.map((row) => row.vocabulary)),
    enrolled: toCandidates(enrolledRows.map((row) => row.vocabulary)),
    random: shuffleArray(pool),
    count,
  });

  const wordById = new Map(answers.map((answer) => [answer.id, answer.word]));

  return buildListeningQuestions({ answers, pool }).map((draft) => ({
    ...draft,
    word: wordById.get(draft.id) ?? "",
  }));
}


/**
 * 타이핑 문항 선정 — 2단계 캐스케이드(도래 → 편입).
 *
 * **리스닝의 3단계(레벨 무작위)가 없다.** 처음 보는 단어를 타이핑으로 내면 찍을 수 없어
 * 사실상 100% 오답이고, 그 오답이 SRS 에 1일 간격 부채로 매일 쌓인다.
 * 편입 이력이 없는 사용자(진단 직후)는 타이핑 0문항이고 읽기가 그만큼 늘어난다.
 *
 * excludedWords 로 **리스닝이 뽑은 단어**를 받는다 — 겹치면 한 단어를 두 방식으로 묻게 되어
 * 실질 문항 수가 준다.
 */
async function selectTypingDrafts(
  userId: string,
  level: QuestionDifficulty,
  count: number,
  excludedWords: readonly string[],
  now: Date = new Date()
): Promise<(TypingDraft & { word: string })[]> {
  if (count <= 0) {
    return [];
  }

  const vocabularySelect = {
    id: true,
    word: true,
    meaning: true,
    audioUrl: true,
    exampleSentence: true,
  };
  // audioUrl ≠ null 을 두 단계 모두에 건다 — 발음이 변별 수단이라 없으면 문항이 성립하지 않는다.
  const audible = { level, audioUrl: { not: null } };

  const [dueRows, enrolledRows] = await Promise.all([
    prisma.userVocabulary.findMany({
      where: { userId, nextReviewDate: { lte: now }, vocabulary: audible },
      orderBy: { nextReviewDate: "asc" },
      take: count * 4,
      select: { vocabulary: { select: vocabularySelect } },
    }),
    prisma.userVocabulary.findMany({
      where: { userId, vocabulary: audible },
      take: count * 8,
      select: { vocabulary: { select: vocabularySelect } },
    }),
  ]);

  const toCandidates = (
    rows: {
      id: string;
      word: string;
      meaning: string;
      audioUrl: string | null;
      exampleSentence: string | null;
    }[]
  ): TypingCandidate[] =>
    rows.flatMap((row) =>
      row.audioUrl
        ? [
            {
              id: row.id,
              word: row.word,
              meaning: row.meaning,
              audioUrl: row.audioUrl,
              exampleSentence: row.exampleSentence,
            },
          ]
        : []
    );

  const answers = selectTypingWords({
    due: toCandidates(dueRows.map((row) => row.vocabulary)),
    enrolled: toCandidates(enrolledRows.map((row) => row.vocabulary)),
    excludedWords,
    count,
  });

  const wordById = new Map(answers.map((answer) => [answer.id, answer.word]));

  return buildTypingQuestions(answers).map((draft) => ({
    ...draft,
    word: wordById.get(draft.id) ?? "",
  }));
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const count = getQuizCount(searchParams);

    const [{ hasCompleted }, profile, todayAttemptCount] = await Promise.all([
      checkDiagnosisStatus(session.user.id),
      prisma.userProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
      prisma.userQuizAttempt.count({
        where: {
          userId: session.user.id,
          attemptedAt: getTodayKSTRange(),
        },
      }),
    ]);

    if (!hasCompleted) {
      return NextResponse.json(
        {
          error: "Diagnosis required",
          requiresDiagnosis: true,
          message: "Complete the diagnosis before starting the quiz.",
        },
        { status: 403 }
      );
    }

    const userLevel = getUserLevel(profile?.level);
    const weaknessCategories = getWeaknessCategories(profile?.weaknessAreas);

    // --- 리스닝·타이핑 선정 (읽기보다 먼저 — 읽기 문항 수가 여기서 정해진다) ---
    const requestedListeningCount = getListeningCount(searchParams, count);
    const listeningDrafts = await selectListeningDrafts(
      session.user.id,
      userLevel,
      requestedListeningCount
    );

    // 타이핑은 리스닝 뒤에 뽑는다 — 같은 단어를 두 방식으로 묻지 않도록 리스닝 단어를 배제한다.
    //   상한은 남은 자리(count - 1 - 듣기)와 TYPING_QUESTION_COUNT 중 작은 쪽이다.
    //   count - 1 은 읽기 최소 1개를 지킨다: 읽기가 0이면 UserQuizAttempt 행이 없어
    //   그날 데일리 완료 판정이 죽는다(리스닝·타이핑 모두 그 테이블에 안 들어간다).
    const typingCeiling = Math.max(
      0,
      Math.min(TYPING_QUESTION_COUNT, count - 1 - listeningDrafts.length)
    );
    const typingDrafts = await selectTypingDrafts(
      session.user.id,
      userLevel,
      typingCeiling,
      listeningDrafts.map((draft) => draft.word)
    );

    // 읽기 후보에서 걸러낼 단어 — 두 유형이 뽑은 것을 합친다.
    const listeningWords = collectUsedWords(listeningDrafts, typingDrafts);

    // 캐스케이드가 요청분을 못 채우면 읽기가 그만큼 더 나온다 —
    //   requested 로 빼면 총 문항이 count 에 못 미친다.
    const readingCount = count - listeningDrafts.length - typingDrafts.length;

    // Fix 4: 비율 기반 sliding window — 최근 풀이 문제 제외
    const poolSize = await prisma.quizQuestion.count({
      where: { difficulty: userLevel },
    });

    const windowSize = Math.min(
      Math.floor(poolSize * RECENT_EXCLUSION_RATIO),
      RECENT_EXCLUSION_MAX
    );

    const recentAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId: session.user.id },
      select: { questionId: true },
      distinct: ["questionId"],
      orderBy: { attemptedAt: "desc" },
      take: windowSize,
    });
    const recentQuestionIds = recentAttempts.map((a) => a.questionId);

    const weaknessCount =
      weaknessCategories.length > 0
        ? Math.floor(readingCount * WEAKNESS_QUESTION_RATIO)
        : 0;

    const selectedWeaknessQuestions = await getRandomQuestions({
      difficulty: userLevel,
      includeCategories: weaknessCategories,
      excludeQuestionIds: recentQuestionIds,
      take: weaknessCount,
    });

    const remainingCount = Math.max(readingCount - selectedWeaknessQuestions.length, 0);
    const selectedNormalQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeCategories: weaknessCategories,
      excludeQuestionIds: [
        ...recentQuestionIds,
        ...selectedWeaknessQuestions.map((question) => question.id),
      ],
      take: remainingCount,
    });

    const selectedQuestionIds = [
      ...selectedWeaknessQuestions,
      ...selectedNormalQuestions,
    ].map((question) => question.id);

    const fallbackCount = Math.max(readingCount - selectedQuestionIds.length, 0);
    const fallbackQuestions = await getRandomQuestions({
      difficulty: userLevel,
      excludeQuestionIds: [...recentQuestionIds, ...selectedQuestionIds],
      take: fallbackCount,
    });

    // Fix 1: 콘텐츠 중복 제거 후 slice
    const questions = deduplicateByContent(
      shuffleArray([
        ...selectedWeaknessQuestions,
        ...selectedNormalQuestions,
        ...fallbackQuestions,
      ]),
      listeningWords
    ).slice(0, readingCount);

    // Fix 4: 풀 고갈 시 recentQuestionIds 제외 없이 재시도 (세션 내 ID 중복만 방지)
    if (questions.length < readingCount) {
      const emergencyFallback = await getRandomQuestions({
        difficulty: userLevel,
        excludeQuestionIds: questions.map((q) => q.id),
        take: readingCount - questions.length,
      });
      // 이 경로도 같은 필터를 통과시킨다 — 그냥 push 하면 풀 고갈 시에만
      //   유형 간 중복이 되살아나는 구멍이 남는다.
      questions.push(
        ...deduplicateByContent(emergencyFallback, new Set([
          ...listeningWords,
          ...questions.map((q) => q.englishWord),
        ]))
      );
    }

    const hasCompletedToday = todayAttemptCount > 0;

    // 읽기 + 리스닝을 섞는다. 리스닝 arm 에는 word·meaning 이 없다(정답 미노출).
    const items: DailyQuizItem[] = shuffleArray([
      ...questions.map(createQuizQuestionResponse),
      ...listeningDrafts.map(
        (draft): DailyQuizItem => ({
          type: "listening",
          id: draft.id,
          audioUrl: draft.audioUrl,
          options: draft.options,
        })
      ),
      // 타이핑 arm 에는 word 가 없다 — 정답이기 때문이다.
      //   blankedSentence 는 힌트 1단계 내용이지만 정답이 아니라 응답에 실어도 된다
      //   (읽기의 koreanHint·contextHint 가 이미 그렇게 실려 있다).
      ...typingDrafts.map(
        (draft): DailyQuizItem => ({
          type: "typing",
          id: draft.id,
          meaning: draft.meaning,
          audioUrl: draft.audioUrl,
          ...(draft.blankedSentence ? { blankedSentence: draft.blankedSentence } : {}),
        })
      ),
    ]);

    return NextResponse.json({
      questions: items,
      userLevel,
      // 합친 배열에서 센다 — 읽기 변수에서 뽑으면 "10문항인데 totalQuestions=7" 이 된다.
      totalQuestions: items.length,
      hasCompletedToday,
      // 추가 연습(isExtraPractice) 모드에서는 서버가 프리 힌트를 소비하지 않으므로
      // 클라이언트 미리보기도 낙관적 상쇄를 꺼야 한다. 그래서 0으로 내려보낸다.
      freeHintCount: hasCompletedToday ? 0 : profile?.freeHintCount ?? 0,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
