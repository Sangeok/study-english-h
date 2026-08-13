---
doc_type: spec
status: implemented
owner: "@hamsangeok"
last_updated: 2026-08-11
target_release: "TBD"
links:
  - issue: "TBD"
    ai_component: none
---

# 데일리 퀴즈 진행 중 세션 이어하기

## 구현 상태 (2026-08-11)

구현 완료. `npx tsc --noEmit` 0건, `npm run lint` 0 errors(기존 warning 1건 유지),
`npm test` 512 passed, `npm run build` 성공.

계획 대비 달라진 점 두 가지:

- `use-quiz-navigation.test.tsx` · `use-daily-quiz.test.tsx` 를 새로 만들었다. 특히 후자는
  "복원 시 서버를 치지 않는다"를 실제로 못박는다 — 이 계약은 react-query 의 `initialData`
  동작에 기대는 부분이라 소스 독해만으로 두면 라이브러리 업그레이드에 조용히 깨진다.
- 저장소 테스트에서 예외 주입은 `mockImplementationOnce` 를 쓴다. happy-dom 의 localStorage 는
  Proxy 라 `vi.restoreAllMocks()` 가 스파이를 되돌리지 못하고, `mockImplementation` 으로
  던지게 만들면 그 구현이 뒤 케이스까지 살아남아 저장이 통째로 죽는다(실제로 겪었다).

## Overview

퀴즈를 풀던 중 페이지를 벗어나면(새로고침·탭 회수·오터치) 진행분이 사라지고, 같은 탭으로 돌아오면
잔여 답안 때문에 **제출조차 막힌다**. 진행 중 세션(문항 세트 + 답안 + 진행 인덱스)을 localStorage에
스냅샷으로 보관하고, 같은 날 재진입 시 그대로 복원한다.

부수 효과로 "나갔다 들어와 새 문항을 받는" 리롤 경로가 좁아진다. 다만 그것이 이 스펙의 목표는
아니다 — 근거는 §2에 있다.

## 1. Current State

### 1-1. 진행분은 서버에 존재하지 않는다

XP·스트릭·`UserQuizAttempt`·`QuizSession`·SRS 편입은 전부 제출 트랜잭션 하나에서 일어난다
(`app/api/quiz/submit/route.ts:136`). 제출 전 이탈은 서버 기준 "없던 일"이고, 그날 데일리 완료
판정도 `UserQuizAttempt` 개수로 하므로(`app/api/quiz/daily/route.ts:380`) 재진입 시 XP는 정상
적립된다. **여기까지는 의도된 동작이며 바꾸지 않는다.**

### 1-2. 문항은 재진입마다 새로 뽑힌다

`useDailyQuiz`가 `gcTime: 0`이라 언마운트 즉시 캐시가 버려지고, 재진입 시 `GET /api/quiz/daily`가
새 추첨을 돌린다(`features/quiz/hooks/use-daily-quiz.ts:23`). 최근 제외 윈도우는 제출된
`UserQuizAttempt`만 보므로(`daily/route.ts:442`), 방금 버린 문항도 다시 뽑힐 수 있다.

### 1-3. 답안만 남아 제출을 막는다 (버그)

답안 맵은 `sessionStorage["quiz-answers-in-progress"]`에 저장되고
(`features/quiz/hooks/use-quiz-answers.ts:52`), 이를 지우는 경로는 **제출 성공 시 하나뿐이다**
(`:48`). 이탈·새로고침 시 정리하지 않는다.

같은 탭에서 재진입하면 옛 답안 N개가 복원되는데 문항은 새 세트다:

```
[7문항 답변 → 새로고침]
  → use-quiz-answers.ts:27 — loadFromStorage() 로 옛 답안 7개 복원
  → use-daily-quiz.ts:20 — 새 문항 10개 페치 (키가 겹치지 않음)
  → use-quiz-state.ts:16 — answeredCount = 17
  → use-quiz-state.ts:17 — canSubmit = (17 === 10) = false
  → quiz-navigation.tsx:19 — 마지막 문항에서 "완료" 버튼 영구 비활성
```

10문항을 다 풀어도 제출할 수 없다. 탈출구는 탭을 닫는 것뿐이다.
옛 `questionId`는 DB에 실재하는 문항이므로, 개수가 우연히 맞아떨어지면 서버는 그 답안까지
정상 채점해 기록한다(`submit/route.ts:161`).

### 1-4. 이탈 경고도 없다

`beforeunload` 경고는 진단에만 있다(`features/diagnosis/hooks/use-unsaved-diagnosis-warning.ts`).
퀴즈에는 없다.

## 2. 결정과 근거

| 결정 | 근거 |
|------|------|
| 이어하기(문항까지 복원)로 간다 | 이탈의 대부분은 실수다. 답안만 복원하는 현 구조는 이득 없이 stuck만 만든다 |
| 저장소는 localStorage + KST 날짜 태그 | sessionStorage는 탭을 닫으면 소멸한다 — 모바일에서 탭이 회수되는 실제 이탈 경로를 못 구한다 |
| 재진입 시 마찰 없이 바로 이어한다 | "새로 시작" 버튼은 리롤을 UI로 공식화한다. 답을 고치려면 이탈이 아니라 이전 버튼으로 충분하다 |
| 서버 문항 고정은 하지 않는다 | 리롤 차단은 이 스펙의 목표가 아니다. 제출 전에는 정답이 노출되지 않으므로(`daily/route.ts:199`) 리롤 이득은 "체감상 어려운 세트 버리기"에 그친다. 리그·배지 왜곡이 실제로 관측되면 별도 스펙으로 다룬다 |
| `beforeunload` 경고는 추가하지 않는다 | 이어하기가 들어오면 나가도 잃지 않는다. 경고는 순손실이다 |

localStorage 저장은 어뷰징을 막지 못한다(DevTools로 키를 지우면 새 세트를 받는다). 목표는
**성실한 사용자의 실수 복구**이고, 어뷰징 난이도가 "나가기 한 번"에서 "저장소 조작"으로
올라가는 것은 부수 효과다.

## 3. Proposed Changes

### 변경 1: 세션 스냅샷 저장소 모듈 (신규)

**파일 (신규):** `features/quiz/lib/quiz-session-storage.ts`

`features/diagnosis/lib/guest-diagnosis-storage.ts`의 패턴을 따른다 — 버전 리터럴 + zod 검증 +
판별 가능한 결과 타입. 저장소 접근을 이 모듈 하나에 가둔다.

```typescript
import { z } from "zod";
import { cefrLevelSchema } from "@/shared/constants/cefr-schema";
import { questionCategorySchema } from "@/entities/question/lib/schemas";
import { toKSTDateString } from "@/entities/user/lib/streak";

export const QUIZ_SESSION_STORAGE_KEY = "quiz-session-in-progress";

const QUIZ_SESSION_SCHEMA_VERSION = 1 as const;

const hintLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const questionOptionSchema = z.object({ text: z.string() });

// DailyQuizItem(features/quiz/types) 유니온을 그대로 반영한다.
//   서버 응답을 그대로 저장하므로 arm 이 어긋나면 복원이 조용히 깨진다.
//
// **options 에 .readonly() 가 필수다.** BaseQuestion·ListeningQuestion 의 options 는
//   `readonly QuestionOption[]` 인데(entities/question/types.ts:36,90), readonly 배열은
//   가변 배열에 할당할 수 없다 — 빼면 `saveQuizSession({ questions, ... })` 호출부가
//   컴파일되지 않는다. 필드 단위 readonly 는 할당성에 영향이 없어 신경 쓸 필요 없다.
//   바깥 questions 배열은 가변으로 둔다 — DailyQuizResponse.questions 가 가변이다.
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

// 제출 답안. **읽기 arm 의 type 은 QuizSubmission 과 똑같이 optional 이어야 한다**
//   (features/quiz/types/index.ts:27). 필수로 두면 z.infer 가 원본 타입보다 좁아져
//   `Record<string, QuizSubmission>` 을 saveQuizSession 에 넘길 수 없다(할당 불가).
// 그래서 discriminatedUnion 이 아니라 union 이다 — 판별자가 optional 이면 쓸 수 없다.
//   arm 마다 필수 필드가 겹치지 않아(questionId+selectedAnswer / vocabularyId+selectedMeaning /
//   vocabularyId+typedAnswer) 순차 매칭으로도 오분류가 나지 않는다.
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
   * 자정에 세션이 끊긴다(이 스펙의 목표에 정면으로 반한다).
   * 폐기 대상은 "하루가 지나도록 손대지 않은 세션"이다.
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

export type QuizSessionMutationResult =
  | { status: "success" }
  | { status: "unavailable" };
```

함수 세 개:

```typescript
export function saveQuizSession(
  session: QuizSessionSnapshotInput,
  now: Date = new Date()
): QuizSessionMutationResult;

/** 날짜가 지났거나 파싱·검증에 실패하면 **지우고** 그 사유를 반환한다.
 *  guest-diagnosis-storage 는 invalid 를 남기지만(진단 결과는 디버깅 가치가 있다),
 *  진행 중 세션은 되살릴 수 없고 남겨두면 매 진입마다 같은 실패를 반복한다.
 *
 *  **ready 를 반환하기 전에 정합성을 강제한다** — 아래 pruneToQuestions 참조. */
export function readQuizSession(now: Date = new Date()): QuizSessionReadResult;

export function clearQuizSession(): QuizSessionMutationResult;
```

`now` 를 인자로 받는 것은 테스트가 자정 경계를 고정하기 위해서다
(`toKSTDateString` 도 같은 형태다).

**검증은 읽기에서만 한다.** `saveQuizSession` 은 zod 파싱 없이 직렬화해 쓴다 — 입력이 이미
타입으로 좁혀져 있고, 키 입력마다 호출되는 경로에 파싱을 얹을 이유가 없다. 저장된 값이
어떤 이유로든 계약을 벗어나면 `readQuizSession` 이 `invalid` 로 잡아 지우므로, 손상된
스냅샷이 화면까지 도달하지 않는다.

**정합성 강제 (`pruneToQuestions`).** zod 는 모양만 본다 — 답안 키가 문항에 실재하는지는
검증하지 않는다. 그 불변식이 깨진 상태가 정확히 §1-3의 stuck 이므로, 스키마만으로는 재발을
막지 못한다. `readQuizSession` 은 파싱 직후 문항 id 집합으로 한 번 걸러 `ready` 를 만든다:

```typescript
function pruneToQuestions(session: QuizSessionSnapshot): QuizSessionSnapshot {
  const ids = new Set(session.questions.map((question) => question.id));
  const keep = <T,>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).filter(([id]) => ids.has(id)));

  return {
    ...session,
    answers: keep(session.answers),
    hintLevels: keep(session.hintLevels),
    degradedIds: session.degradedIds.filter((id) => ids.has(id)),
    audioPlayedIds: session.audioPlayedIds.filter((id) => ids.has(id)),
    // 인덱스도 여기서 맞춘다 — useQuizNavigation 의 clampIndex 가 방어하지만,
    //   저장소가 내보내는 값 자체가 유효한 편이 소비처를 신뢰할 수 있게 만든다.
    currentIndex: Math.min(session.currentIndex, session.questions.length - 1),
  };
}
```

이 함수 하나로 "answeredCount 가 questions.length 를 넘는" 상태가 구조적으로 불가능해진다.

### 변경 2: 게이트가 스냅샷을 읽어 컨테이너에 넘긴다

**파일:** `features/quiz/ui/quiz-entry-gate.tsx`

읽기는 **"시작하기" 클릭 핸들러에서만** 한다. 렌더 중 localStorage를 읽으면 게이트 상단 주석이
경고하는 하이드레이션 불일치가 그대로 재현되고, `useSyncExternalStore`로 감싸려면 매 호출마다
새 객체를 만들지 않도록 캐시를 따로 들고 있어야 한다 — 클릭 시점 1회 읽기면 둘 다 피한다.

```typescript
const [session, setSession] = useState<QuizSessionSnapshot | null>(null);
const [started, setStarted] = useState(false);

function handleStart() {
  const result = readQuizSession();
  setSession(result.status === "ready" ? result.session : null);
  setStarted(true);
}

if (started) {
  return (
    <QuizContainer
      // 복원본이 있으면 그쪽 값이 이긴다 — 진행 중 세션의 문항 구성은 바꿀 수 없다.
      listeningEnabled={session?.listeningEnabled ?? isListeningEnabled}
      restoredSession={session}
    />
  );
}
```

시작 화면과 오디오 토글은 그대로 둔다. 복원 여부에 따라 문구를 바꾸려면 렌더 시점에 저장소를
읽어야 하므로 하지 않는다.

### 변경 3: 복원본이 있으면 페치하지 않는다

**파일:** `features/quiz/hooks/use-daily-quiz.ts`

`useSuspenseQuery`는 조건부로 호출할 수 없다. `staleTime: Infinity`와 `initialData`를 함께 쓰면
초기 데이터가 신선한 것으로 취급되어 페치가 일어나지 않는다.

```typescript
export function useDailyQuiz(
  listeningEnabled: boolean,
  restored?: DailyQuizResponse
): DailyQuizReturn {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.quiz.daily(listeningEnabled),
    queryFn: () => fetchDailyQuiz(undefined, listeningEnabled),
    // 복원 시에는 이 값이 그대로 data 가 되고 queryFn 은 호출되지 않는다.
    ...(restored ? { initialData: restored } : {}),
    gcTime: 0,
    staleTime: Infinity,
  });
  // ...
}
```

### 변경 4: 답안 훅이 복원 시드를 받고 스냅샷을 쓴다

**파일:** `features/quiz/hooks/use-quiz-answers.ts`

인자가 넷을 넘으므로 객체 인자로 바꾼다. `sessionStorage` 읽기·쓰기는 전부 제거하고
`quiz-session-storage`를 쓴다.

```typescript
interface UseQuizAnswersArgs {
  questions: DailyQuizItem[];
  currentIndex: number;
  isQuizSubmitted: boolean;
  /** 복원본. 없으면 빈 상태로 시작한다. */
  restored: QuizSessionSnapshot | null;
  // 스냅샷에 함께 저장되는 세션 메타. **객체로 묶지 않고 스칼라로 평탄화한다** —
  //   `meta: {...}` 를 컨테이너에서 인라인으로 만들면 매 렌더 새 참조가 되어,
  //   쓰기 effect 의 deps 에 넣으면 렌더마다 localStorage 쓰기가 일어나고
  //   빼면 react-hooks/exhaustive-deps 가 경고한다. 스칼라는 값 비교라 둘 다 없다.
  listeningEnabled: boolean;
  userLevel: string;
  hasCompletedToday: boolean;
  freeHintCount: number;
}
```

- `answers` · `hintLevels` 초기값은 `restored` 에서 온다. `loadFromStorage()` 는 삭제한다.
- `degradedRef` · `audioPlayedRef` 는 `restored?.degradedIds` · `restored?.audioPlayedIds` 로
  시드한다. 빼면 재생 실패 표시와 발음 청취 여부가 복원 시 초기화되어, 실제로 들은 타이핑
  정답이 `produced: true`(SRS easy)로 과대 평가된다(`submit/route.ts:262`).
- 저장은 `persistSession` 이라는 하나의 `useCallback` 이 맡는다. deps 는 스냅샷을 구성하는
  값 전부(`answers` · `hintLevels` · `currentIndex` · `questions` · 메타 스칼라 4개)다.
  호출 지점은 둘이다:
  - `[persistSession, isQuizSubmitted]` 만 deps 로 갖는 effect — 구성값이 바뀌면
    `persistSession` 의 정체성이 바뀌어 effect 가 다시 돈다. 값들을 effect deps 에 중복해서
    나열하면 `exhaustive-deps` 와 어긋난다
  - **`markAudioPlayed`** — 이 함수는 ref 만 바꾸므로 리렌더도 effect 도 일으키지 않는다
    (`use-quiz-answers.ts:158`). 여기서 직접 부르지 않으면 발음만 듣고 답 없이 이탈한 경우
    `audioPlayed` 가 유실되어, 위에서 막으려던 SRS 과대평가가 그대로 발생한다.
- 제출 성공 시에는 `clearQuizSession()`.

**기록 게이트 — 흔적이 없으면 저장하지 않는다.** 현재 구조의 쓰기 effect 는 마운트 직후
`answers = {}` 로 한 번 돈다(`use-quiz-answers.ts:51`). 그대로 두면 "시작하기"를 누른 순간
그날 문항 세트가 고정되어, 한 문제도 풀지 않고 나간 사용자까지 같은 세트에 묶인다 —
§2가 정한 목표(실수 복구)를 넘어서는 효과다. 복원할 것이 있을 때만 저장한다.

**판정은 반드시 `persistSession` 안에서, 호출 시점에 한다.** 렌더 스코프의 `const` 로 빼면
`markAudioPlayed` 경로가 죽는다 — 그 함수는 ref 만 바꾸고 리렌더를 일으키지 않으므로
`persistSession` 은 직전 렌더에서 계산된 값(오디오 재생 전이라 `false`)을 보고 그냥 반환한다.
발음만 듣고 답 없이 이탈하는 바로 그 경우가 위에서 막으려던 유실이다.

```typescript
const persistSession = useCallback(() => {
  // 렌더 스코프로 끌어올리지 말 것 — ref 두 개는 리렌더 없이 바뀐다.
  const hasProgress =
    Object.keys(answers).length > 0 ||
    Object.keys(hintLevels).length > 0 ||
    audioPlayedRef.current.size > 0 ||
    degradedRef.current.size > 0;

  if (!hasProgress) return;

  saveQuizSession({
    questions,
    answers,
    hintLevels,
    currentIndex,
    degradedIds: Array.from(degradedRef.current),
    audioPlayedIds: Array.from(audioPlayedRef.current),
    listeningEnabled,
    userLevel,
    hasCompletedToday,
    freeHintCount,
  });
}, [
  questions, answers, hintLevels, currentIndex,
  listeningEnabled, userLevel, hasCompletedToday, freeHintCount,
]);
```

두 ref 는 deps 에 넣지 않는다 — 참조가 고정이라 넣어도 의미가 없고, 값은 호출 시점에 읽는다.

힌트·오디오까지 조건에 넣는 것은 답안 이전에도 되돌릴 진행이 존재하기 때문이다
(힌트 레벨은 XP 페널티로 이어진다).

**쓰기 주체를 이 훅에 두는 이유:** 스냅샷 필드의 대부분(답안·힌트·두 ref)이 이 훅 안에 있다.
컨테이너에 별도 영속화 훅을 두면 ref 값을 밖으로 꺼내야 하고, 서로 다른 렌더 시점의 조각이
한 스냅샷에 섞일 수 있다.

**단일 키를 유지하는 이유:** 타이핑 문항은 `onChange` 마다 `onAnswer` 를 부르므로
(`typing-question.tsx:169`) 키 입력 한 번에 스냅샷 전체가 다시 직렬화된다. 문항·메타는 불변인데
매번 다시 쓰는 셈이지만, 10문항 페이로드는 3~5KB 수준이고 `JSON.stringify` + `setItem` 이
수십 µs 규모다. 키를 문항용·진행용으로 쪼개면 한쪽만 남는 부분 상태를 다뤄야 하므로,
측정되지 않은 비용을 피하려고 정합성 문제를 사는 거래가 된다.

### 변경 5: 진행 인덱스 복원

**파일:** `features/quiz/hooks/use-quiz-navigation.ts`

```typescript
export function useQuizNavigation(
  totalQuestions: number,
  onSubmit: () => void,
  initialIndex = 0
) {
  const [rawIndex, setRawIndex] = useState(initialIndex);
  // ...
}
```

인덱스는 `pruneToQuestions` 가 이미 문항 수에 맞춰 내보내므로 정상 경로에서는 그대로 쓰인다.
기존 `clampIndex` 는 그래도 남는 이중 방어다 — 범위를 벗어난 값이 들어오면 첫 문항으로
되돌린다(`use-quiz-navigation.ts:11`).

### 변경 6: 컨테이너 배선

**파일:** `features/quiz/ui/quiz-container.tsx`

```typescript
interface QuizContainerProps {
  listeningEnabled: boolean;
  restoredSession: QuizSessionSnapshot | null;
}
```

```typescript
// 렌더마다 새 객체를 만들지 않는다 — react-query 는 캐시가 빌 때만 initialData 를 읽으므로
//   기능상 무해하지만, restoredSession 이 불변인데 매번 새로 만들 이유가 없다.
const initialQuiz = useMemo(
  () => (restoredSession ? toDailyQuizResponse(restoredSession) : undefined),
  [restoredSession]
);

const { questions, userLevel, hasCompletedToday, freeHintCount } = useDailyQuiz(
  listeningEnabled,
  initialQuiz
);
const { currentIndex, ... } = useQuizNavigation(
  questions.length,
  handleSubmit,
  restoredSession?.currentIndex ?? 0
);
const { answers, hintLevels, ... } = useQuizAnswers({
  questions,
  currentIndex,
  isQuizSubmitted: submitMutation.isSuccess,
  restored: restoredSession,
  listeningEnabled,
  userLevel,
  hasCompletedToday,
  freeHintCount,
});
```

`toDailyQuizResponse` 는 스냅샷에서 `DailyQuizResponse` 모양을 만드는 순수 함수로,
`quiz-session-storage.ts` 에 함께 둔다(스냅샷 필드를 아는 유일한 모듈이다).
`totalQuestions` 는 `questions.length` 로 채운다 — 스냅샷에 따로 저장하지 않는다.

## 4. 수정 대상 파일 요약

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `features/quiz/lib/quiz-session-storage.ts` | **신규** | 스냅샷 스키마 · 저장/복원/폐기 · `pruneToQuestions` · `toDailyQuizResponse` |
| `features/quiz/lib/quiz-session-storage.test.ts` | **신규** | 저장소 계약 테스트 |
| `features/quiz/ui/quiz-entry-gate.tsx` | 수정 | 클릭 시 스냅샷 1회 읽기 → 컨테이너에 전달 |
| `features/quiz/hooks/use-daily-quiz.ts` | 수정 | `restored` → `initialData` |
| `features/quiz/hooks/use-daily-quiz.test.tsx` | **신규** | 복원 시 페치 없음 · 복원본 우선 · 미복원 시 기존 동작 |
| `features/quiz/hooks/use-quiz-answers.ts` | 수정 | 객체 인자 · 복원 시드 · 스냅샷 쓰기 (sessionStorage 제거) |
| `features/quiz/hooks/use-quiz-navigation.ts` | 수정 | `initialIndex` 인자 |
| `features/quiz/hooks/use-quiz-navigation.test.tsx` | **신규** | 초기 인덱스 · 기본값 보존 · clamp 이중 방어 |
| `features/quiz/ui/quiz-container.tsx` | 수정 | 세 훅 배선 |
| `features/quiz/hooks/use-quiz-answers.test.tsx` | 수정 | 하네스 갱신 + 복원·저장 계약 10건 추가 |

`app/api/quiz/*` 는 건드리지 않는다. 서버 변경 0.

## 5. Implementation Plan

### 단계 1: 저장소 모듈 + 테스트

의존성 없음. 순수 모듈이라 UI 없이 완결된다.

1. `quiz-session-storage.ts` 작성
2. `quiz-session-storage.test.ts` — 저장→복원 왕복, 날짜 불일치→`expired`+삭제,
   버전 불일치·파손 JSON→`invalid`+삭제, 빈 키→`empty`, 저장소 예외→`unavailable`,
   **문항에 없는 답안·힌트 키가 `ready` 에서 제거된다**(§1-3 stuck 의 구조적 차단),
   **`type` 없는 읽기 답안도 파싱된다**(`ReadingSubmission` 과 같은 optional 계약)

### 단계 2: 훅 3종

단계 1에 의존.

1. `use-daily-quiz.ts` — `initialData` 경로
2. `use-quiz-navigation.ts` — `initialIndex`
3. `use-quiz-answers.ts` — 객체 인자 · 시드 · 쓰기. 기존 테스트를 새 시그니처로 갱신하고
   복원 계약을 검증하는 케이스를 추가한다:
   - `restored` 의 답안·힌트·`degradedIds`·`audioPlayedIds` 가 초기 상태로 들어온다
   - 복원된 문항에 답을 고치면 그 값이 이긴다(시드가 다시 덮어쓰지 않는다)
   - 흔적이 없으면(`hasProgress` false) 저장 호출이 일어나지 않는다
   - `markAudioPlayed` 만 호출해도 저장이 일어난다 — ref 경로의 회귀 방지

### 단계 3: 배선

1. `quiz-container.tsx` → `quiz-entry-gate.tsx` 순으로 연결
2. 수동 시나리오(§7) 통과 확인

## 6. Expected Outcomes

### 사용자 경험

- 7문항 풀다 새로고침 → 7번 문항·고른 답·진행 인덱스 그대로 복귀
- 문항을 보기만 하고(답·힌트·오디오 없이) 나감 → 저장된 것이 없으므로 새 세트를 받는다
- 알림으로 앱 전환 후 탭이 회수됨 → 돌아오면 이어짐
- 탭을 닫았다 같은 브라우저로 저녁에 재방문 → 같은 날이면 이어짐
- 자정을 넘겨 재방문 → 스냅샷 폐기, 새 퀴즈 (진행분은 미제출로 소멸 — 현재와 같다)
- 제출 성공 → 스냅샷 삭제, 다음 진입은 추가 연습 새 세트

### 정량

- 재진입 시 완료 버튼이 열리지 않던 stuck **제거** (문항과 답안이 같은 스냅샷에서 나온다)
- 복원 경로의 `GET /api/quiz/daily` 호출 **0회** (`initialData` 로 페치를 건너뛴다)

### 하위 호환성

- 서버 계약·DB 스키마 변경 없음
- 옛 키 `quiz-answers-in-progress`(sessionStorage)는 더 이상 읽지 않는다. 배포 시점에 그 키를
  들고 있던 세션은 새 코드가 무시하므로 stuck이 즉시 풀리고, 탭을 닫으면 키 자체가 사라진다 —
  별도 마이그레이션 코드를 넣지 않는다

## 7. 수용한 한계

| 한계 | 판단 |
|------|------|
| 기기 간 이어짐 없음. PC 진행분이 남은 채 폰에서 새로 풀면 같은 날 두 세트가 공존한다 | 둘 다 제출 가능하고, 먼저 제출한 쪽이 데일리·나중이 추가 연습(XP 0)으로 서버가 판정한다(`submit/route.ts:140`). 데이터 정합성 문제는 아니다 |
| 저장소를 지우면 리롤 가능 | §2의 결정. 목표가 실수 복구다 |
| 멀티탭 동시 진행 시 마지막 쓰기가 이긴다 | 드물고, 최종 정산은 서버가 한다 |
| 복원 시 현재 문항의 `timeSpent` 가 다시 측정된다 | 클라이언트 자기신고 통계값이고 상한도 걸려 있다(`MAX_TIME_SPENT_SEC`) |
| 스냅샷의 `freeHintCount` · `hasCompletedToday` 가 stale일 수 있다 | 화면 표시용 낙관값이다. XP·프리 힌트 소비·추가 연습 판정은 제출 트랜잭션이 서버에서 다시 한다 |
| 시크릿 모드 등 저장소 차단 환경은 이어하기가 없다 | 저장 실패를 무시하는 현 동작과 같다. stuck은 없다 |
| 게이트의 오디오 토글을 바꿔도 진행 중 세션에는 반영되지 않는다 | 문항 구성이 이미 정해져 있다. 다음 퀴즈부터 반영된다 |
| 아무 흔적(답·힌트·오디오) 없이 이탈하면 이어할 것이 없다 — 재진입 시 새 세트 | §3 변경 4의 기록 게이트. 복원할 진행이 없는데 문항만 고정하는 것은 목표 밖이다 |
| 자정을 넘겨 계속 푸는 세션은 날짜가 재스탬프되어 살아남는다 | 의도다. 폐기 대상은 하루가 지나도록 손대지 않은 세션이다 |

## 8. 검증 방법

1. **타입 체크:** `npx tsc --noEmit`
2. **린트:** `npm run lint`
3. **테스트:** `npm test`
4. **빌드:** `npm run build`
5. **수동 테스트:**
   - 퀴즈 3문항 답변 → F5 → 4번 문항 위치, 답 3개 유지, 네트워크 탭에 `daily` 요청 없음
   - 이어서 끝까지 풀고 제출 → 완료 버튼 활성, XP 정상, localStorage 키 삭제 확인
   - 3문항 답변 → 탭 닫기 → 새 탭으로 재진입 → 이어짐
   - 3문항 답변 → DevTools로 시스템 날짜를 다음 날로 → 재진입 → 새 퀴즈, 키 삭제 확인
   - 힌트 연 문항 답변 → 이탈 → 복원 후 제출 → 결과 화면의 XP 페널티가 힌트를 반영하는지 확인
   - 타이핑 문항에서 발음 재생 → 이탈 → 복원 후 정답 제출 → SRS 편입이 easy로 과대 평가되지
     않는지 확인(`audioPlayed` 복원 검증)
   - 오늘 완료 후 추가 연습 진입 → 이탈 → 복원 시 "추가 연습 모드" 배너 유지 확인
   - 시작만 하고 아무것도 하지 않은 채 이탈 → 재진입 시 새 세트, localStorage 키 없음
   - 타이핑 문항에서 한 글자씩 입력 → DevTools Performance 로 입력당 프레임 드랍이 없는지 확인
     (단일 키 유지 판단의 전제)

## References

- 관련 스펙: `docs/specs/spec-diagnosis-incomplete-exit.md` (진단 쪽 중도 이탈 처리)
- 관련 스펙: `docs/specs/rfc-daily-quiz-completion-model.md` (데일리 완료 판정)
- 저장소 패턴 선례: `features/diagnosis/lib/guest-diagnosis-storage.ts`
- FSD 아키텍처: `docs/architecture/fsd-architecture-guidelines.md`
- 코드 스타일: `docs/conventions/code-style.md`
- 파일 네이밍: `docs/conventions/file-naming.md`
