---
doc_type: archive
status: superseded
owner: "@hamsangeok"
last_updated: 2026-07-12
target_release: "TBD"
links:
  - issue: "TBD"
    ai_component: none
---

# RFC: 레벨 진단 한국어 힌트 제거 (4단계 플랜)

> **대체됨 (2026-07-12)**: 이 문서는 `scoringVersion`을 즉시 도입하는 선택 A를 포함한 과거 구현 계획이다.
> 현재 기준은 `docs/specs/spec-diagnosis-scoring-policy.md`이며, 사용자가 확정한 선택 B에 따라 이 문서의
> `scoringVersion`, `CURRENT_SCORING_VERSION`, `needsRediagnosis`, 관련 마이그레이션·재진단 지시는 실행하지 않는다.

## 구현 상태 (2026-07-09 코드 검증)

- **Phase 0-A (서버 채점 전환)**: 구현 완료 — `app/api/diagnosis/submit/route.ts`가 DB 재조회 후 `formatDiagnosisAnswers(dbQuestions, …)`로 서버 내부 채점. API 경계에서 `isCorrect` 제거(`question-generator.ts` 주석 참조).
- **Phase 0-B (옵션 셔플)**: 구현 완료 — `question-generator.ts`, `quiz/daily/route.ts` 응답 시점 셔플.
- **Phase 2 (한국어 힌트 제거)**: 구현 완료 — 진단 문항이 문맥 추론형(뜻 힌트 없음)으로 전환 (커밋 44635ef).
- **미도입**: `LevelDiagnosis.scoringVersion` 필드 — 힌트 제거 전후 점수 비교 가능성 이슈는 수용 여부 미결정. 필요 시 별도 소형 RFC로 재개.

## Overview

레벨 진단(`features/diagnosis`)을 문맥 기반 cloze 형식(문장 + 4지선다)으로 전환해 일반 퀴즈 Level 0과의 난이도 역전을 해소하고 CEFR 배정 신뢰도를 확보한다.

초안(v1)은 `diagnosis-question-card.tsx` 의 한국어 힌트 JSX 블록 제거만 다뤘지만, 시드 데이터 감사 결과 (a) **모든 문항에서 정답 옵션이 `order: 1` 위치에 고정되어 있고** UI·API 경로 어디에도 옵션 셔플이 없어 사용자가 A만 눌러도 만점을 받을 수 있으며, (b) **A1/A2 문항의 distractor가 "주제 형제 단어"로 구성**되어 있어 한국어 힌트를 단독 제거하면 저-중 레벨 사용자가 체계적으로 under-diagnose 되는 회귀가 발생하고, (c) **진단 정답 판정이 `features/diagnosis/lib/format-answers.ts` 를 통해 클라이언트 훅에서 수행**되고 결과가 `diagnosisAnswerSchema` 의 `isCorrect: z.boolean()` 으로 서버에 그대로 전송되어 (`entities/question/lib/schemas.ts:20`), **사용자는 DevTools Console 에서 `isCorrect: true` × 20 payload 를 제출해 UI 를 보지 않고도 C2 배정을 받을 수 있는 client-trust exploit** 가 존재한다. 따라서 본 RFC는 단일 변경을 **4단계 플랜**으로 확장한다.

0. **Phase 0 — 서버 측 정답 판정 + 응답 옵션 셔플 (client-trust exploit · position bias 동시 제거)**: 단일 PR 원자 머지로 두 sub-step 을 함께 적용한다.
    - **Phase 0-A**: `diagnosisAnswerSchema` 를 **`{ questionId, selectedText }` 로 최소 축소**(difficulty/category 는 클라이언트가 주장할 수 없고 서버가 DB 에서 읽는다), 배열 길이 `.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` 및 중복 questionId 거부 `.refine` 을 스키마 단에서 강제, `formatDiagnosisAnswers` 를 서버 측 DB 재조회 기반으로 재배치하며 **출력 `difficulty` · `category` 도 DB 값만 사용**, `/api/diagnosis/submit` 에서 `prisma.quizQuestion.findMany` 후 서버 내부 판정. 미답변 문항은 `selectedText: ""` 로 전송되어 "정답 매칭 없음 → `isCorrect: false`" 로 자연 처리되므로 시간 초과 자동 제출 경로도 200 OK 로 수용된다 (`.min(1)` 강제 금지). `QuestionOption.isCorrect` 를 API 경계 타입·응답 페이로드에서 완전 제거 → 클라이언트는 더 이상 채점 결과·난이도·카테고리·문항 분포 어떤 것도 주장할 수 없다.
    - **Phase 0-B**: `features/diagnosis/lib/question-generator.ts` 와 `app/api/quiz/daily/route.ts` 의 옵션 매핑을 `shuffleArray(options).map(...)` 로 교체해 position 암기 경로도 근본 차단. DB 비파괴 — `order` 컬럼은 그대로 두고 응답 페이로드에서만 셔플하므로 Phase 1 의 `(questionId, order)` 안정 키 UPDATE 전략과 충돌하지 않는다.
    - Phase 1–3 모두 이 수정 위에서만 유효하다 (Phase 0 없이 한국어 힌트를 제거하면 Phase 3 재보정 표본이 통째로 오염된다).
1. **Phase 1 — 시드 distractor 개편**: A1/A2 문항의 주제 형제 distractor를 비주제 단어로 교체. 단, 관사(`a`/`an`)·가산성·모음/자음 시작 등 **문법 단서가 정답을 단독 결정하지 않도록** 제약 규칙을 준수한다. **선행 조건**으로 `QuizOption` 에 `@@unique([questionId, order])` 제약을 추가하는 분리 migration 을 먼저 머지해 "안정 키" UPDATE 가 DB 레벨에서 보장되도록 한다.
2. **Phase 2 — UI 한국어 힌트 제거 + 마이그레이션**: v1 의 원 변경. Phase 1 완료 후에만 안전. 기존 사용자의 힌트-있음 시절 점수 기록과 충돌하지 않도록 `LevelDiagnosis.scoringVersion` 필드를 도입하고 진단 시작 안내 모달(타이머 일시정지 포함)을 추가한다. `CURRENT_SCORING_VERSION` 상수는 FSD 계층 규칙 준수를 위해 `shared/constants/diagnosis.ts` 에 배치한다 (`shared/lib/diagnosis-guards.ts` 의 역참조 방지). `needsRediagnosis` 플래그는 `checkDiagnosisStatus` 내부에만 두지 않고 `app/api/diagnosis/status/route.ts` 응답과 `DiagnosisStatusResponse` 클라이언트 타입까지 함께 노출한다 (후속 배너 작업이 추가 plumbing 없이 시작 가능하도록).
3. **Phase 3 — CEFR/약점 로직 재보정**: 실측 분포 기반으로 `mapScoreToCEFR` 임계값뿐 아니라 `analyzeWeaknesses` 60% 임계값과 `getRecommendedLevel` 약점 3개 하향 조건도 함께 재검토한다.

## Current State

### 문제 0-A: 진단 정답 판정이 클라이언트에서 수행되어 서버가 client-sent `isCorrect` 를 그대로 신뢰 (client-trust exploit)

`features/diagnosis/lib/format-answers.ts:3-15` 의 `formatDiagnosisAnswers` 는 **클라이언트 훅** `features/diagnosis/hooks/use-diagnosis-quiz.ts:11` 에서 호출되어 `question.options.find((option) => option.isCorrect)?.text === answersById[question.id]` 로 정답 여부를 판단한다. 그 결과는 `DiagnosisAnswer.isCorrect: boolean` 으로 포장되어 `POST /api/diagnosis/submit` payload 에 실린다.

서버 측 `entities/question/lib/schemas.ts:17-22` 의 `diagnosisAnswerSchema` 는 `isCorrect: z.boolean()` 을 **그대로 신뢰**한다:

```typescript
export const diagnosisAnswerSchema = z.object({
  questionId: z.string().min(1),
  difficulty: questionDifficultySchema,
  isCorrect: z.boolean(),   // ← 클라이언트가 주장하는 값을 재검증 없이 수용
  category: questionCategorySchema,
});
```

`app/api/diagnosis/submit/route.ts:31` 의 `calculateDiagnosisScore(answers)` 는 이 신뢰된 boolean 을 그대로 누적한다 (`features/diagnosis/lib/scoring.ts:13` — `if (answer.isCorrect) totalWeightedScore += weight;`). 서버는 questionId 로 DB 에 재조회해 정답을 확인하지 않는다.

**파급 효과 (RFC 전제 전체를 무효화)**:

- DevTools Console 에서 `fetch('/api/diagnosis/submit', { method: 'POST', body: JSON.stringify({ answers: Array.from({ length: 20 }, () => ({ questionId: '<아무값>', difficulty: 'C1', isCorrect: true, category: 'daily' })) }) })` 를 호출하면 UI 를 한 번도 보지 않고 totalScore 100 / C2 배정이 가능하다.
- Phase 0-B 의 옵션 셔플은 이 경로와 완전히 독립이다 (사용자는 옵션을 고르지 않고 payload 만 조작).
- Phase 1 의 distractor 개편·Phase 2 의 한국어 힌트 제거 효과 모두 client 가 스스로 채점하는 한 의미 없음.
- Phase 3 재보정 표본이 client-trust exploit 로 생성된 가짜 고득점에 오염되면 임계값 결정이 무효화된다.

즉 Phase 0-A 가 position bias 제거(Phase 0-B)보다 **더 본질적인 취약점** 이다. Phase 0 은 양자를 단일 PR 로 함께 해결한다.

### 문제 0-B: 정답 옵션이 항상 첫 번째 위치에 고정 (position bias)

`prisma/seed-quiz.ts` 의 **200문항 전부에서 `isCorrect: true` 가 `order: 1` 에만 존재**한다 (`isCorrect: true, order: [2-4]` grep 결과 0건). 진단·퀴즈 양쪽 경로는 다음과 같이 옵션을 고정 순서로만 조회한다:

- `features/diagnosis/lib/question-generator.ts:13` — `options: { orderBy: { order: "asc" } }`
- `app/api/quiz/daily/route.ts:13` — 동일하게 `orderBy: { order: "asc" }`

코드베이스 어디에도 옵션 자체를 셔플하는 로직이 없다 (`shuffleArray` 는 문항 단위에만 적용). 결과적으로 **진단·퀴즈 양쪽 모두 정답이 항상 화면상 첫 번째(A) 위치**에 노출된다.

**파급 효과 (RFC 전제 전체를 무효화)**:

- 사용자는 문장도, 보기도 읽지 않고 무조건 A만 골라 100점을 받을 수 있다.
- Phase 1 의 distractor 개편(101문항)은 사용자가 보기 텍스트를 읽지 않으면 의미 없다.
- Phase 2 의 한국어 힌트 제거 효과 ("어휘 지식을 동원하게 함") 가 성립하지 않는다.
- Phase 3 재보정 표본이 "A만 클릭하는 사용자" 로 오염되어 분포가 왜곡되고 임계값 결정이 무효화된다.
- Phase 2 rollback 트리거 ("진단 이탈률 30% 증가") 는 A-탭 사용자가 빠르게 끝내버리면 반대 방향(이탈률 감소)으로 발화해 잘못된 안전 신호를 줄 수 있다.

즉 Phase 0-A (서버 측 판정) 와 Phase 0-B (옵션 셔플) 둘 다 없이는 Phase 1–3 전체가 공염불이 된다. 본 RFC 는 이 둘을 Phase 1 선행 작업으로 격상해 **단일 PR 원자 머지** 한다.

### 문제 1: 난이도 위계 역전

`features/diagnosis/ui/flow/diagnosis-question-card.tsx:89-99` 은 모든 진단 문항에서 `question.koreanHint` 를 패널티 없이 항상 노출한다.

```tsx
{/* 한국어 힌트 */}
<div className="text-center mb-8">
  <div className="inline-block px-6 py-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl mb-4">
    <span className="text-sm font-medium text-purple-700">
      한국어 힌트
    </span>
  </div>
  <h3 className="text-3xl md:text-4xl font-display font-bold text-purple-950 mb-6">
    {question.koreanHint}
  </h3>
</div>
```

반면 `features/quiz/ui/game/quiz-question.tsx` 의 힌트 시스템은 다음과 같이 동작한다.

- **Level 0 (기본)**: 문장 + 4지선다만 표시. 한국어 힌트 숨김.
- **Level 1**: 사용자 요청 시 상황 힌트(`contextHint`) 표시. XP 감소.
- **Level 2**: 추가 요청 시 한국어 힌트(`koreanHint`) 표시. XP 추가 감소.

즉 일반 퀴즈에서 한국어 힌트는 **가장 마지막 단계**이자 **XP 패널티가 가장 큰 자원**인데, 진단에서는 기본값으로 제공된다. 결과적으로:

- 진단이 일반 퀴즈 Level 0보다 쉽다 → 난이도 위계 역전
- 실제 어휘 지식 없이 Korean→English 매칭만으로 답 가능 → 스코어 부풀리기 가능
- 실력에 맞지 않는 CEFR 레벨 배정

### 문제 2: A1/A2 시드 distractor가 "주제 형제"로 구성됨

`prisma/seed-quiz.ts` 감사 결과 A1/A2 문항의 distractor는 대부분 **정답과 같은 카테고리의 형제 단어**로 채워져 있다. 문맥 문장은 카테고리만 지시할 뿐 특정 단어를 유일하게 결정하지 못한다.

| 난이도 | 문장 | 정답 | 보기 |
|---|---|---|---|
| A1 | I ate an _____ for breakfast. | apple | apple, orange, banana, grape |
| A1 | Can I have some _____? | water | water, juice, coffee, tea |
| A1 | My father drives a _____. | car | car, bus, bike, train |
| A1 | What time is it on the _____? | clock | clock, phone, watch, computer |
| A1 | Please sit on the _____. | chair | chair, table, bed, floor |
| A1 | I put my books in the _____. | bag | bag, box, desk, chair |
| A2 | Don't forget your _____ when traveling abroad. | passport | passport, ticket, bag, phone |

반면 B1 이상 문항은 distractor가 대체로 **반의어** (`compromise` vs refuse/insist/demand, `bold` vs timid/cautious/hesitant, `accelerate` vs slow/stop/reverse) 로 설계되어 있어 cloze 단독으로 변별 가능하다.

즉 **v1 의 "cloze 단서가 충분함" 가정은 B1+ 에서만 참이다.** A1/A2 에서는 한국어 힌트를 제거하면 사실상 25% 랜덤 추측으로 전락한다.

### 문제 2의 파급 효과

`features/diagnosis/config/index.ts:16-22` 의 분포:

```typescript
export const QUESTION_DISTRIBUTION = [
  { level: "A1", count: 6 },
  { level: "A2", count: 5 },
  { level: "B1", count: 4 },
  { level: "B2", count: 3 },
  { level: "C1", count: 2 },
] as const;
```

총 20문항 중 A1+A2가 11문항 / 가중치 16/50(32%)을 차지한다. 이 32%가 랜덤 노이즈가 되면:

- 실제 B1 사용자: 기대 점수 ~72/100 → ~48/100 (B1 → A2 하향)
- 실제 A2 사용자: 사실상 A1 바닥으로 붕괴
- 실제 C1 사용자: 거의 영향 없음

또한 진단·퀴즈 양쪽 모두 `quizQuestion` 테이블을 공유하므로 (`features/diagnosis/lib/question-generator.ts:9`), 현재 **퀴즈 Level 0도 A1 문항에서 이미 같은 품질 이슈**를 갖고 있다. Phase 1 은 본 RFC와 독립적으로도 정당화된다 (퀴즈 Level 0 품질 개선).

### 문제 3: CEFR 임계값이 힌트 있는 상태에서 보정됨

`features/diagnosis/lib/scoring.ts:32-39`:

```typescript
function mapScoreToCEFR(score: number): string {
  if (score >= 96) return "C2";
  if (score >= 81) return "C1";
  if (score >= 61) return "B2";
  if (score >= 41) return "B1";
  if (score >= 21) return "A2";
  return "A1";
}
```

이 임계값(96/81/61/41/21)은 한국어 힌트가 있는 상태의 점수 분포를 기준으로 설정되었다. 힌트를 제거하면 전체 평균이 하락하므로 임계값 재보정이 필요하다.

### 대안 검토

| 방안 | 장점 | 단점 | 채택 |
|---|---|---|---|
| A. v1 그대로 (UI만 제거) | 1-commit, 단순 | A1/A2 회귀, 임계값 부정합, position bias·client-trust exploit 미해결 | ❌ |
| B. 힌트 유지 + XP 패널티 | 초보자 친화 | 어뷰징 가능, 스코어링 재설계, client-trust exploit 미해결 | ❌ |
| C. B1+ 한정 힌트 제거 | 시드 무수정, 단일 커밋 | 세션 내 UX 혼재, 저레벨 품질 이슈·client-trust exploit 미해결 | ❌ |
| D. 시드 개편 → 힌트 제거 → 재보정 (client-trust exploit 미해결) | 근본 해결 일부 | client 가 `isCorrect` 를 조작 가능한 한 모든 품질 개선이 공염불 | ❌ |
| E. 옵션 셔플 → 시드 개편 → 힌트 제거 → 재보정 (client-trust 미해결) | position 암기 차단 | 여전히 DevTools 로 `isCorrect: true` × 20 제출 가능 → Phase 3 재보정 표본 오염 | ❌ |
| F. **서버측 정답 판정 + 옵션 셔플 → 시드 개편 → 힌트 제거 → 재보정** | client-trust · position 암기 **양쪽** 근본 차단, 퀴즈 Level 0 도 개선 | Phase 0 범위 확장 (submit schema · format-answers 재배치 · 응답 페이로드 축소) | ✅ |

## Proposed Changes

### Phase 0 — 서버 측 정답 판정 + 응답 옵션 셔플 (client-trust exploit · position bias 동시 제거)

Phase 0 은 두 개의 **원자적 sub-step** 으로 구성되며 단일 PR 로 함께 머지한다. Phase 0-A 없이 Phase 0-B 만 적용하면 셔플이 무의미하고 (client 가 여전히 `isCorrect` 를 읽어 자가 채점), Phase 0-B 없이 Phase 0-A 만 적용하면 position 암기 경로가 잔존한다.

#### Phase 0-A — 정답 판정을 서버로 이전 ( `isCorrect` client-trust exploit 제거 )

**현 상태의 치명적 결함**:

1. `features/diagnosis/lib/format-answers.ts:3-15` 의 `formatDiagnosisAnswers` 는 **클라이언트 훅** `features/diagnosis/hooks/use-diagnosis-quiz.ts:11` 에서 호출된다. 이 함수는 `question.options.find((option) => option.isCorrect)?.text === answersById[question.id]` 로 **클라이언트에서 정답 여부를 판정**한다.
2. 판정 결과는 `DiagnosisAnswer.isCorrect: boolean` 필드로 포장되어 `POST /api/diagnosis/submit` 에 전송된다.
3. `entities/question/lib/schemas.ts:17-22` 의 `diagnosisAnswerSchema` 는 `isCorrect: z.boolean()` 을 **그대로 신뢰**한다. 서버는 DB 에 재조회하지 않고 클라이언트가 보낸 boolean 을 `calculateDiagnosisScore` (`features/diagnosis/lib/scoring.ts:13`) 에 그대로 넘긴다.
4. 결과적으로 **악의적 사용자는 UI 를 보지 않고 DevTools 콘솔에서 20개 answer 를 모두 `isCorrect: true` 로 구성해 POST 만 날려도 totalScore 100 / C2 배정**을 받을 수 있다. Phase 0-B 의 셔플은 이 경로를 전혀 차단하지 못한다.

**설계 원칙 (client-trust exploit 의 모든 우회 경로 차단)**:

서버는 클라이언트가 보낸 **어떤 필드도 가중치 계산에 직접 사용하지 않는다**. 클라이언트는 오직 `{ questionId, selectedText }` 만 주장하고, 서버는 DB 재조회로 `difficulty` · `category` · `isCorrect` 를 **전부** 결정한다. 이는 초안의 "selectedText 만 클라이언트가 보낸다" 가정을 한 걸음 더 확장한 것으로, 초안에서 클라이언트가 여전히 주장하던 `difficulty` / `category` 를 통한 가중치 조작 우회 경로를 제거한다. 더불어 다음 세 가지 스키마 단 구조적 방어를 강제해 "1개 답변으로 100%", "같은 questionId × 20 중복", "시간 초과 자동 제출 실패" 세 가지 회귀 경로를 함께 차단한다.

**변경 대상**:

1. **`entities/question/lib/schemas.ts`** — `diagnosisAnswerSchema` 를 다음과 같이 **최소 필드만** 가지도록 재정의한다:
   ```typescript
   export const diagnosisAnswerSchema = z.object({
     questionId: z.string().min(1),
     // selectedText 는 빈 문자열 허용. 미답변 문항은 빈 문자열로 들어와 서버 측에서
     // "정답 매칭 없음 → isCorrect: false" 로 자연 처리된다. min(1) 을 강제하면
     // useDiagnosisTimer 만료 시 자동 제출된 미답변 문항이 400 으로 전면 거부되어
     // 진단 결과 자체가 발급되지 않는 회귀가 발생한다 (시간 초과 자동 제출 경로).
     selectedText: z.string(),
   });

   export const diagnosisSubmitRequestSchema = z.object({
     answers: z
       .array(diagnosisAnswerSchema)
       // 분포 고정: features/diagnosis/config 에서 총 문항 수를 계산해 상수화하고,
       // 클라이언트가 일부 답변만 보내서 maxPossibleScore 분모를 조작해 100% 를
       // 달성하는 경로를 차단한다. 총합 불일치 시 400.
       .length(TOTAL_DIAGNOSIS_QUESTION_COUNT)
       // 중복 questionId 거부: 같은 문항을 N번 보내 동일 가중치를 N번 누적시키는
       // 경로를 차단한다.
       .refine(
         (arr) => new Set(arr.map((a) => a.questionId)).size === arr.length,
         "Duplicate questionId"
       ),
   });
   ```
   - `TOTAL_DIAGNOSIS_QUESTION_COUNT` 는 `shared/constants/diagnosis.ts` 에 `export const TOTAL_DIAGNOSIS_QUESTION_COUNT = 20;` 형태로 배치한다 (기존 `DIAGNOSIS_TIME_LIMIT_SECONDS` 옆). `shared/constants/index.ts` barrel 에도 재수출 항목을 추가한다.
     - **왜 `features/diagnosis/config/` 가 아닌 `shared/constants/` 인가**: `entities/question/lib/schemas.ts` (스키마 `.length(...)`) 가 이 상수를 참조해야 한다. FSD 계층 규칙상 `entities` 계층은 `features` 계층을 import 할 수 없으므로 (`.claude/rules/architecture.md` 의 unidirectional flow), `features/diagnosis/config/` 를 단일 출처로 두면 스키마가 FSD 를 위반하게 된다. **가장 낮은 공통 조상 계층**인 `shared/` 에 두어야 `entities/` (상위 계층) 와 `features/` (상위 계층) 가 모두 순방향으로 import 할 수 있다. `CURRENT_SCORING_VERSION` 과 동일한 배치 근거이다.
     - **drift 방지**: `features/diagnosis/config/index.ts` 에서 `if (QUESTION_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0) !== TOTAL_DIAGNOSIS_QUESTION_COUNT) throw new Error("TOTAL_DIAGNOSIS_QUESTION_COUNT drift")` 런타임 assert 를 추가해 분포 배열과 상수의 일치를 보장한다. `QUESTION_DISTRIBUTION` 을 수정하면서 상수를 갱신하지 않으면 서버 시작 시 즉시 실패한다.
   - **`difficulty` · `category` 필드는 스키마에서 완전히 제거**. 클라이언트가 이 두 필드를 주장할 경로를 원천 봉쇄한다. zod `strict()` 또는 기본 동작으로 unknown key 거부.
2. **`features/diagnosis/hooks/use-diagnosis-quiz.ts`** — `formatDiagnosisAnswers` 호출을 제거하고, 제출 payload 를 `{ answers: questions.map((q) => ({ questionId: q.id, selectedText: answersById[q.id] ?? "" })) }` 형태로 구성한다. `difficulty` / `category` 는 보내지 않는다. **`answersById[q.id] ?? ""` 의 빈 문자열 fallback 은 의도적으로 유지**한다 — 서버 스키마가 `z.string()` 으로 완화되어 있어 미답변 문항이 400 을 유발하지 않고 `isCorrect: false` 로 자연 처리된다. 타이머 만료 시 자동 `handleSubmit` 경로도 동일하게 안전하다.
3. **`features/diagnosis/lib/format-answers.ts`** — 파일 자체를 유지하되 시그니처를 다음 형태로 재배치한다:
   ```typescript
   import type { Prisma } from "@/lib/generated/prisma/client";
   import type { DiagnosisAnswer, DiagnosisSubmitAnswer } from "@/entities/question";

   type DbQuestionWithOptions = Prisma.QuizQuestionGetPayload<{
     include: { options: true };
   }>;

   export function formatDiagnosisAnswers(
     dbQuestions: DbQuestionWithOptions[],
     submitAnswers: DiagnosisSubmitAnswer[]
   ): DiagnosisAnswer[] {
     const questionById = new Map(dbQuestions.map((q) => [q.id, q]));
     return submitAnswers.map((submitted) => {
       const dbQuestion = questionById.get(submitted.questionId);
       if (!dbQuestion) {
         // 라우트에서 사전 검증되지만 방어적으로 한 번 더 throw.
         throw new Error(`Unknown questionId: ${submitted.questionId}`);
       }
       const correctOption = dbQuestion.options.find((o) => o.isCorrect);
       return {
         questionId: dbQuestion.id,
         // ⚠️ difficulty·category 는 **반드시 DB 값**을 사용한다. 클라이언트가
         // 주장한 값을 그대로 쓰면 "모든 답변 difficulty: C1" 조작으로 가중치를
         // 부풀리는 우회 경로가 열린다. 현재 스키마는 두 필드를 아예 받지 않지만,
         // 미래에 필드가 다시 추가되더라도 이 함수는 절대 submitted 값을 읽지
         // 않는다는 불변 조건을 유지한다.
         difficulty: dbQuestion.difficulty,
         category: dbQuestion.category,
         // 빈 selectedText 는 correctOption.text 와 매칭되지 않으므로 자연히 false.
         // 미답변 문항 경로가 여기서 처리된다.
         isCorrect: correctOption?.text === submitted.selectedText,
       };
     });
   }
   ```
   `features/diagnosis/lib/index.ts` barrel 에서 제거하고 서버 경로에서만 직접 import 한다.
4. **`app/api/diagnosis/submit/route.ts`** — 다음 순서로 서버 측 채점을 수행한다:
   - `const questionIds = validation.data.answers.map((a) => a.questionId);`
   - `const dbQuestions = await prisma.quizQuestion.findMany({ where: { id: { in: questionIds } }, include: { options: true } });` (신뢰할 수 있는 정답·난이도·카테고리 원천)
   - **DB 재조회 길이 검증**: `if (dbQuestions.length !== validation.data.answers.length) return NextResponse.json({ error: "unknown questionId present" }, { status: 400 });` — zod 가 중복·길이·유일성을 모두 막지만, 존재하지 않는 questionId 가 섞인 경우는 여기서만 잡을 수 있다.
   - `const scoredAnswers = formatDiagnosisAnswers(dbQuestions, validation.data.answers);` (서버 내부 판정, `difficulty` · `category` 모두 DB 기반)
   - 이후 기존대로 `calculateDiagnosisScore(scoredAnswers)` 호출. 클라이언트가 보낸 `selectedText` 는 채점에만 쓰이고 score DB 저장 경로에는 `isCorrect` 만 들어간다.
5. **`features/diagnosis/lib/question-generator.ts`** — 옵션 매핑에서 `isCorrect: opt.isCorrect` 를 제거한다. 클라이언트 응답 페이로드의 각 option 은 `{ text: opt.text }` 만 포함한다.
6. **`app/api/quiz/daily/route.ts`** — `createQuizQuestionResponse` 의 옵션 매핑에서도 `isCorrect` 를 제거한다 (퀴즈 데일리 응답). 확인 결과 `features/quiz/ui/game/quiz-question.tsx` 내부는 `option.text` 만 참조하며 (`selectedAnswer === option.text`), `features/quiz/ui/result/quiz-detail-results.tsx` 의 `item.isCorrect` 는 **제출 결과 API** (`/api/quiz/submit` 응답) 의 `isCorrect` 이지 GET `/api/quiz/daily` 응답의 option 필드가 아니므로 영향 없음. 단 Phase 0-A 작업 시작 전 이 두 경로를 한 번 더 grep 으로 재확인한다.
7. **`entities/question/types.ts`** — `QuestionOption` 인터페이스에서 `isCorrect: boolean` 필드를 제거한다. DB 모델에는 그대로 있지만 **API 경계 타입에서는 노출하지 않는다** (`order` 필드와 동일 원칙).
8. **관련 퀴즈 서버 경로** (`app/api/quiz/submit/route.ts` 등) — 서버 내부에서 DB 의 `QuizOption.isCorrect` 로 판정하는 경로는 그대로 유지한다. 클라이언트 응답에서만 필드가 사라진다.
9. **`shared/constants/diagnosis.ts`** — `export const TOTAL_DIAGNOSIS_QUESTION_COUNT = 20;` 를 추가한다 (기존 `DIAGNOSIS_TIME_LIMIT_SECONDS` 옆). `shared/constants/index.ts` 의 **기존** `export { DIAGNOSIS_TIME_LIMIT_SECONDS } from "./diagnosis";` 줄을 `export { DIAGNOSIS_TIME_LIMIT_SECONDS, TOTAL_DIAGNOSIS_QUESTION_COUNT } from "./diagnosis";` 로 in-place 갱신한다.
   - **왜 `features/diagnosis/config/` 가 아닌가**: `entities/question/lib/schemas.ts` 가 `.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` 로 이 상수를 참조한다. FSD 계층 규칙상 `entities` → `features` import 는 역방향이므로 위반이다. `shared/` 에 두면 `entities/` 와 `features/` 모두 순방향 import 가능.
   - **drift 방지**: `features/diagnosis/config/index.ts` 에 `import { TOTAL_DIAGNOSIS_QUESTION_COUNT } from "@/shared/constants";` 후 `if (QUESTION_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0) !== TOTAL_DIAGNOSIS_QUESTION_COUNT) throw new Error("TOTAL_DIAGNOSIS_QUESTION_COUNT drift");` 런타임 assert 를 추가한다. `QUESTION_DISTRIBUTION` 을 수정하면서 상수를 갱신하지 않으면 서버 시작 시 즉시 실패.

**타입 영향**:

- `DiagnosisAnswer` (서버 내부 타입) 은 그대로 `{ questionId, difficulty, category, isCorrect }` 를 가진다. 이 타입은 **서버 측에서 DB join 후에만 구성**되며 외부로 노출되지 않는다.
- `DiagnosisSubmitAnswer` 라는 새 타입을 `entities/question/types.ts` 에 추가한다: `{ questionId: string; selectedText: string }`. 이 타입이 클라이언트→서버 와이어 타입이며 **difficulty 와 category 를 의도적으로 담지 않는다**. 클라이언트가 주장할 수 있는 면적을 최소화하는 것이 목적이다.

**검증 (Phase 0-A 단독, 모든 우회 경로 포함)**:

- **(a) 기본 exploit 거부**: DevTools 에서 `fetch('/api/diagnosis/submit', { method: 'POST', body: JSON.stringify({ answers: [...{ questionId, difficulty: 'C1', isCorrect: true, category: 'daily', selectedText: 'x' }, × 20 ] }) })` 를 시도 → 400 (`difficulty`/`category`/`isCorrect` unknown key 또는 `answers.length !== TOTAL_DIAGNOSIS_QUESTION_COUNT` 으로 거부).
- **(b) 중복 questionId exploit 거부**: 같은 questionId × 20 payload 제출 → 400 (`.refine` duplicate questionId).
- **(c) 소수 답변 exploit 거부**: `answers.length === 1` 로 정답 하나만 포함해 제출 → 400 (`.length(20)` 위반).
- **(d) difficulty 조작 exploit 무력화**: 미래에 실수로 `difficulty` 필드를 스키마에 다시 추가하더라도 `formatDiagnosisAnswers` 가 DB 값만 사용하므로 가중치 조작 불가. 단위 테스트 또는 코드 리뷰로 "`submitted.difficulty`" 문자열이 서버 측 파일에 등장하지 않음을 검증.
- **(e) 시간 초과 자동 제출 정상 경로**: 사용자가 20문항 중 5문항만 답한 상태에서 `useDiagnosisTimer` 만료 → `handleSubmit` 자동 호출 → 15개 문항이 `selectedText: ""` 로 전송됨 → 서버가 200 OK 로 수용하고 미답변 15개를 `isCorrect: false` 로 처리 → totalScore 가 5문항 중 정답 수에 비례해 정상 계산. **400 회귀가 발생하지 않는지 반드시 확인**.
- **(f) 정상 정답 경로**: 정답 선택만으로 20개 제출 → totalScore 100. 오답만으로 20개 제출 → totalScore 0.
- **(g) 존재하지 않는 questionId**: `questionId: 'fake'` 를 섞어 제출 → 400 (`dbQuestions.length !== submitAnswers.length`).

#### Phase 0-B — 응답 옵션 셔플 (position 암기 제거)

**변경 대상**:

1. `features/diagnosis/lib/question-generator.ts` — 기존 `options: q.options.map(...)` 를 `options: shuffleArray(q.options).map(...)` 로 교체한다. **`shuffleArray` 는 `shared/lib/shuffle-array.ts` 의 Fisher-Yates 구현으로 원본 배열을 변형하지 않고 새 배열을 반환**한다. 따라서 반환값을 반드시 `.map(...)` 체이닝에 사용해야 한다. `shuffleArray(q.options);` 만 단독 호출하면 결과가 버려져 no-op (셔플이 적용되지 않은 원본이 그대로 응답) 이 된다 — 컴파일·lint 는 통과하므로 발견이 늦다.
2. `app/api/quiz/daily/route.ts` — `createQuizQuestionResponse` 내부 `question.options.map(...)` 를 `shuffleArray(question.options).map(...)` 로 교체한다. `shuffleArray` 는 이미 파일 상단에서 import 되어 있다. 동일하게 반환값 사용 필수.

**전략: 응답 시점 셔플 (DB 비파괴)**

- DB 의 `QuizOption.order` 컬럼은 그대로 둔다. 응답 페이로드에서만 배열 순서를 셔플한다.
- Phase 1 의 `(questionId, order)` 안정 키 UPDATE 전략과 충돌하지 않는다 (Phase 1 은 `order` 로 row 를 식별해 `text` 만 교체하므로, 응답 시점 셔플은 Phase 1 의 식별자 안정성에 영향을 주지 않음).
- `order` 는 이미 API 경계에서 제거되어 `entities/question/types.ts` 의 `QuestionOption` 에 노출되지 않는다 ("DB의 `order` 필드는 API 경계에서 제거되며 entity 타입에 노출되지 않음" 주석 참조). Phase 0-A 에서 `isCorrect` 까지 제거되면 API 경계 `QuestionOption` 은 `{ text }` 만 남는다.
- 같은 문항을 다시 풀 때마다 옵션 배치가 달라져 "A만 누르기" 전략이 무효화된다.

**왜 DB-time 셔플이 아닌가**:

- DB 에서 `order` 를 무작위 재배치하는 방식은 Phase 1 의 "(questionId, order) 안정 키 UPDATE-only" 제약과 정면 충돌한다 (order 자체가 바뀌면 Phase 1 의 식별자 매핑이 깨진다).
- 또한 같은 사용자가 같은 문항을 다시 만나도 항상 같은 배치로 고정되어 "이 문항의 정답은 C 였다" 수준의 위치 암기가 여전히 가능하다. 응답 시점 셔플은 진단 재시도마다 배치가 바뀌므로 position 암기 경로를 근본 차단한다.

**정답 판정 경로 확인 (셔플 안전성)**:

- Phase 0-A 이후 정답 판정은 **서버 측에서 DB 재조회한 option 기반** 으로만 이루어지므로 응답 배열 순서와 완전히 독립적이다. 클라이언트는 `option.text` 만 보유하며 (선택 추적용), 서버는 `questionId + selectedText` 를 받아 DB 에서 `option.isCorrect` 로 판정한다.

**검증 (Phase 0-B)**:

- 진단 20문항을 3회 연속 시작해 각 문항의 옵션 배치가 서로 다른지 브라우저에서 확인. **정답 선택지가 회마다 다른 위치** 에 가는지 명시적으로 보아야 한다 (문항 순서 셔플은 이미 동작 중이므로 혼동 금지).
- 정답만 선택 → `totalScore: 100` 확인 (정답 판정 회귀 부재).
- 오답만 선택 → `totalScore: 0` 확인.
- 퀴즈 데일리도 동일 3회 반복으로 position 변동 확인.

**PR 분리**: Phase 0 (A+B 합본) 은 Phase 1 과 **별도 PR**. Phase 0 이 운영에 먼저 적용된 이후에만 Phase 1 이 의미를 갖는다.

### Phase 1 — A1/A2 시드 distractor 개편

**대상**: `prisma/seed-quiz.ts` 의 A1 50문항 + A2 51문항 = 총 101문항

#### 교체 규칙 (모든 규칙을 동시에 만족해야 함)

1. **의미적 변별 확보**: 문장 + 보기만으로 정답이 **의미상** 유일하게 결정되어야 한다.
2. **관사 일치**: 빈칸 앞에 `a`가 오면 4개 보기 모두 자음 시작, `an`이 오면 모두 모음 시작이어야 한다. 정답만 관사로 결정되는 문법 누수 방지.
3. **가산성·수 일치**: `some`, `many`, 복수형 동사, 관사 `the` 뒤 단/복수 등 수 정보가 있는 문장은 모든 보기가 같은 속성(가산 단수 / 불가산 / 복수)이어야 한다.
4. **난이도 상한**: distractor는 정답과 같은 CEFR 레벨 또는 그 이하 어휘로만 구성한다. (A1 문항이면 A1 어휘로만 채움 → A1 학습자가 "단어 자체를 모르는" 상황이 발생하지 않도록)
5. **주제 형제 제한**: distractor 중 **정답과 동일 카테고리의 형제 단어**(예: apple–orange–banana)는 최대 1개까지만 허용. 나머지는 다른 카테고리의 단어로 채운다.

#### 판정 및 교체 절차

1. 각 문항에 규칙 1 부터 5 를 순차 적용해 위반 여부 확인
2. 규칙 1 부터 5 를 모두 만족하면 변경 없음
3. 하나라도 위반하면 distractor 1–3개를 교체. 정답·`koreanHint`·`sentence`·`difficulty`·`category` 는 절대 수정하지 않는다.

#### 교체 예시 (규칙 준수 버전)

```diff
 {
   koreanHint: "사과",
   englishWord: "apple",
   sentence: "I ate an _____ for breakfast.",
   difficulty: "A1",
   category: "daily",
   options: [
     { text: "apple",    isCorrect: true,  order: 1 },
-    { text: "orange",   isCorrect: false, order: 2 },
-    { text: "banana",   isCorrect: false, order: 3 },
-    { text: "grape",    isCorrect: false, order: 4 },
+    { text: "umbrella", isCorrect: false, order: 2 },
+    { text: "eye",      isCorrect: false, order: 3 },
+    { text: "ear",      isCorrect: false, order: 4 },
   ],
 }
```

**교체 후 체크리스트**:

- **규칙 2 (관사)**: 문장이 `an _____` 이므로 모든 보기가 모음 시작 — `apple`, `umbrella`, `eye`, `ear` ✅ (기존 `book/car/chair` 안은 정답만 모음 시작이 되어 관사로 풀리는 문법 누수를 만들었음)
- **규칙 3 (가산성)**: 모두 가산 단수 명사 ✅
- **규칙 4 (난이도)**: 모두 A1 기본 어휘 ✅
- **규칙 5 (주제 형제)**: orange/banana/grape 제거, 주제 형제 0개 ✅
- **규칙 1 (의미 변별)**: "breakfast 로 먹을 수 있는" 유일한 항목은 `apple`. `umbrella/eye/ear` 은 의미상 배제 → 어휘 지식 기반 풀이 필요 ✅

#### 구현 형태

`prisma/fix-a1-a2-distractors.ts` 일회성 마이그레이션 스크립트.

- **문항 식별 키 (필수)**: `QuizQuestion.id` 는 `cuid()` 로 생성되어 dev DB 와 prod DB 에서 서로 다른 값을 가진다. 따라서 스크립트에 questionId 를 하드코딩하는 것은 금지된다. 대신 다음 2-step lookup 을 강제한다:
  1. **콘텐츠 키 → questionId (다중 매칭 가드 포함)**: `(englishWord, sentence)` 로 `prisma.quizQuestion.findMany` 실행 후 **`result.length === 1` 을 명시적으로 assert**. 0 이면 미매칭, 2+ 면 유일성 가정 붕괴. 둘 다 즉시 `throw` 로 트랜잭션 rollback. `findFirst` / `findFirstOrThrow` 는 다중 매칭 시 조용히 첫 번째 행만 반환하여 **silent corruption 경로를 열기 때문에 사용 금지**. 이 키는 `prisma/seed-quiz.ts:3948-3953` 의 dedup 로직이 이미 사용하는 유일성 가정이며 현재 시드에서는 실제로 유일하지만, DB 레벨 제약은 없으므로 수동 assert 로 방어한다.
  2. **questionId → option UPDATE**: step 1 에서 얻은 questionId 와 하드코딩된 `order` (2, 3, 4 중 교체 대상) 로 `prisma.quizOption.updateMany({ where: { questionId, order }, data: { text } })` 실행.
  - 스크립트의 교체 목록은 `{ englishWord, sentence, replacements: [{ order, newText }] }` 배열 형태로 작성한다. `questionId` 필드는 절대 등장하지 않는다.
  - **왜 `englishWord` 단독이 아닌가**: 이론상 같은 `englishWord` 가 다른 `sentence` 로 여러 문항에 걸쳐 재사용될 수 있다. 시드 감사 시점에서는 유일했더라도 장래 문항 추가 시 충돌할 수 있으므로 `(englishWord, sentence)` 복합 키로 방어한다.
  - **왜 `@@unique([englishWord, sentence])` migration 을 안 추가하는가**: QuizQuestion 측에 DB 제약을 추가하는 것은 정당한 개선이지만 본 RFC 의 Phase 1 범위를 넘는다 (별도 데이터 정합성 PR 에서 처리). 본 RFC 에서는 **스크립트 내부 런타임 assert** 로만 방어하고, 향후 제약 추가는 follow-up 으로 둔다.
- **사전 스키마 보강 (선행 migration)**: Phase 1 작업 시작 전에 `prisma/schema.prisma` 의 `QuizOption` 모델에 `@@unique([questionId, order])` 를 추가하고 `npx prisma migrate dev --name add_quiz_option_unique` 로 독립 migration 을 만든다.
  - **왜 선행 migration 인가**: 현재 스키마는 `@@index([questionId])` 만 있어 동일 `(questionId, order)` 조합의 중복이 DB 레벨에서 금지되지 않는다. RFC 하단에서 "`(questionId, order)` 안정 키로 UPDATE 만 수행" 이 안전하다고 주장하려면 이 키가 실제로 **유일성 제약**이어야 한다. 제약 없이 `updateMany` 를 돌리면 중복 행이 조용히 둘 다 업데이트되거나 0건을 반환해도 에러가 없다.
  - migration 적용 시 DB 에 이미 중복 `(questionId, order)` 가 있으면 migration 자체가 실패한다 → 실패하면 수동으로 중복을 해소한 후 재실행. 선행 실패는 Phase 1 진행을 막는 정상 동작이다.
  - 이 migration 은 distractor 교체 commit 과 **분리된 commit** 으로 둔다. 리뷰 단위 분리.
- **단일 경로**: 기존 `QuizOption` 레코드를 `(questionId, order)` 로 조회해 `update` 만 수행한다. **레코드 삭제·재삽입 금지**.
  - **왜 UPDATE-only 인가**: 현재 스키마에서 `UserQuizAttempt.selectedAnswer` 는 `String` 이며 `QuizOption.id` 를 FK 로 참조하지 않는다 (`prisma/schema.prisma:148-162`). 즉 option 레코드를 삭제·재삽입해도 **참조 무결성 자체는 파괴되지 않는다**.
  - **진짜 위험**: `UserQuizAttempt.selectedAnswer` 는 응답 시점의 `option.text` 를 문자열로 박제한 값이다. Phase 1 이후 해당 questionId 의 현재 options 에는 과거 answer 텍스트가 더 이상 존재하지 않을 수 있다. 지금은 과거 attempt 를 현재 options 에 매칭하는 경로가 없어 실무 영향이 0 이지만, 향후 "오답 복습" 류 기능이 붙으면 조용히 어긋난다.
  - `(questionId, order)` 안정 키로 UPDATE 만 수행하면 `QuizOption.id` 가 보존되어 향후 join 경로가 추가되어도 안전하다. DELETE+INSERT 경로는 회피한다.
- **update count assert (필수)**: 각 교체 대상 option 업데이트 후 `updateMany` 반환값 `{ count }` 또는 `findFirst + update(where: { id })` 경로의 영향 row 수를 **명시적으로 `=== 1` 로 assert** 한다. 0 이면 대상 미발견(선행 migration 가정 붕괴), 2 이상이면 유일성 제약 누락. 어느 쪽이든 즉시 스크립트 전체 rollback.
- **원자성**: 전체 업데이트를 `prisma.$transaction` 으로 감싸 부분 적용 방지. update count assert 가 실패하면 `throw` 로 트랜잭션 rollback 을 트리거한다.
- **자동 assert**: 스크립트 실행 전 각 문항에 대해 규칙 2·3 을 코드로 검증한다. 예: `sentence` 에 `" an "` 또는 `"^An "` 이 매칭되면 `options.every(o => startsWithVowelSound(o.text))` 를 assert. 실패하면 즉시 중단.
- **음성 예외 whitelist (필수)**: 영어 관사 규칙은 **음성 기준**이라 순수 철자 정규식 `/^[aeiouAEIOU]/` 로는 부정확하다. `startsWithVowelSound` 헬퍼는 다음 whitelist 를 하드코딩하여 음성 예외를 흡수한다:
  - **철자 자음 + 모음 음가 (an 필요)**: `hour`, `honor`, `honest`, `heir`, `herb` (미국식)
  - **철자 모음 + 자음 음가 (a 필요)**: `university`, `uniform`, `unique`, `useful`, `user`, `usual`, `European`, `one`, `once`
  - whitelist 에 들어있으면 철자 판정을 override 한다. A1 어휘에서는 `hour` 가 가장 현실적 충돌 후보이며, A2 에서는 `honest`/`university`/`uniform`/`useful` 까지 확장될 수 있다. whitelist 는 코드 상단에 별도 `const` 로 두어 리뷰어가 한눈에 확인 가능해야 한다.
- **assert 자기검증**: `assertArticleAgreement` / `assertCountability` 헬퍼 자체의 버그를 방어하기 위해, 스크립트 상단에 **expected-pass / expected-fail fixture 쌍 5~10개** 를 정의하고 실제 DB 업데이트 **직전에** 헬퍼를 이 fixture 로 self-test 한다. 기대와 다른 결과가 하나라도 나오면 즉시 중단한다. 검증 없는 assert 는 "돌았다" 는 착시만 제공한다.
  - **fixture 필수 항목** (음성 예외가 whitelist 로 실제 커버되는지 검증):
    - `{ sentence: "I waited for an hour.", options: ["hour", "apple", "umbrella", "egg"], expect: "pass" }` — `hour` 가 whitelist 로 통과
    - `{ sentence: "She goes to a university.", options: ["university", "school", "store", "park"], expect: "pass" }` — `university` 가 whitelist 로 통과
    - `{ sentence: "I ate an ___ for breakfast.", options: ["apple", "banana", "grape", "orange"], expect: "fail" }` — `banana/grape` 는 자음 시작이라 거부되어야 함
    - `{ sentence: "She bought a ___.", options: ["apple", "book", "chair", "desk"], expect: "fail" }` — `apple` 은 모음 시작이라 거부되어야 함
  - whitelist 가 누락되면 첫 두 fixture 가 실패해 스크립트가 중단된다. 이것이 phonetic edge case 에 대한 구조적 방어다.
- **재시드 금지**: `prisma/seed-quiz.ts` 재실행으로 적용하는 경로는 사용하지 않는다. (빈 DB 초기 투입용으로만 동기 업데이트한다.)

#### 스코프 고정

distractor 교체만 수행한다. `koreanHint` ↔ `englishWord` 의미 불일치(예: "큰 소리로" → blatant) 같은 데이터 오류 정정은 본 RFC 범위 밖으로 **분리**한다. 필요 시 별도 태스크/PR 을 생성한다. Phase 1 커밋의 diff 가 비결정적으로 팽창하는 것을 방지하기 위함이다.

### Phase 2 — UI 한국어 힌트 제거 + 기존 사용자 마이그레이션

**변경 대상**:

1. `features/diagnosis/ui/flow/diagnosis-question-card.tsx` — 한국어 힌트 JSX 제거 및 여백 재조정
2. `features/diagnosis/ui/flow/diagnosis-test.tsx` — 진단 시작 안내 문구 주입
3. `prisma/schema.prisma` + 마이그레이션 — `LevelDiagnosis.scoringVersion` 필드 추가
4. `shared/lib/diagnosis-guards.ts` — 기존 `scoringVersion < 2` 사용자의 쿨다운 bypass

#### 2-A. 한국어 힌트 JSX 제거

`diagnosis-question-card.tsx:89-99` 의 한국어 힌트 JSX 블록 제거. 난이도/카테고리 배지 다음에 바로 문장 블록이 이어지는 구조가 된다.

**변경 후 구조** (개념도):

```tsx
<div className="relative z-10">
  {/* 난이도 + 카테고리 배지 */}
  <div className="flex items-center gap-3 mb-10">
    {/* ... */}
  </div>

  {/* 문장 (이제 유일한 질문 컨텐츠) */}
  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 mb-8 border border-purple-100">
    <p className="text-2xl md:text-3xl text-purple-900 text-center leading-relaxed font-medium">
      {question.sentence}
    </p>
  </div>

  {/* 선택지 */}
  <div className="space-y-4">
    {/* ... */}
  </div>
</div>
```

**여백·크기 보정**: 제거되는 한국어 힌트 블록이 차지하던 수직 공간은 약 120–160px 이다. 배지 `mb-6` → `mb-8` 만으로는 상쇄되지 않으므로 다음을 병행한다.

- 배지 `mb-6` → `mb-10`
- 문장 컨테이너 `p-6` → `p-8`
- 문장 텍스트 `text-xl md:text-2xl` → `text-2xl md:text-3xl` (질문이 카드의 유일한 초점이 되므로 시각 무게 증가)

위 수치는 초기 제안이며, Phase 2 작업 중 브라우저에서 실제 확인 후 미세 조정한다.

#### 2-B. 진단 시작 안내 모달 추가

**형태**: 진단 플로우 마운트 시 **1회 노출되는 오버레이 모달**. `diagnosis-test.tsx` 내부에 `useState<boolean>(true)` 로 `showIntroModal` 상태를 두고, questions 로드 완료 후 Q1 위에 오버레이로 노출한다. "시작하기" 버튼 클릭 시 `setShowIntroModal(false)` 로 닫히고 Q1 이 드러난다.

**왜 모달인가**: 인라인 배너를 Q1 에만 두면 Q1 → Q2 전환에서 layout shift 가 발생하여 §2-A 의 여백 보정이 무효화된다. 모든 문항에 영구 배너를 두면 20문항 내내 시각적 소음이다. **1회 모달 + 명시적 닫기** 가 layout 안정성과 주의 집중을 동시에 만족한다.

**상태 영속성**: session-local. 페이지 새로고침 / 재진단 시 다시 노출된다. `localStorage` 등에 "본 적 있음" 을 저장하지 않는다. 진단마다 "힌트 없음" 맥락을 재각인시키는 편이 안전하다.

**위치**: 신규 컴포넌트 `features/diagnosis/ui/flow/diagnosis-intro-modal.tsx` 를 작성하여 `diagnosis-test.tsx` 의 `<div className="relative z-10 py-8 px-4 md:px-8">` 블록 내부 최상단에 조건부 렌더한다.

**로딩/에러 분기와의 순서 (필수)**: `diagnosis-test.tsx` 는 현재 **early-return 기반 구조**이다. 리팩터 전에 실제 파일 구조를 정확히 이해해야 한다.

**현재 파일의 실측 구조** (`features/diagnosis/ui/flow/diagnosis-test.tsx`):

- 라인 10-11: `DiagnosisLoading` / `DiagnosisError` 는 이미 `../status/diagnosis-loading` · `../status/diagnosis-error` 에서 **별도 컴포넌트로 추출되어 있다** → 추출 작업 불필요.
- 라인 36-37: `useDiagnosisTimer(timeLimit, handleSubmit)` 2-인자 호출 (현재 `paused` 없음 — Phase 2 에서 세 번째 인자 추가 대상).
- 라인 39-43: 완료 처리는 JSX 분기가 아니라 `useEffect` 내부 `router.push(/diagnosis/result?id=...)` **side effect**. `isSubmitSuccess && submitResult` 를 감지해 실행된다 → 완료 분기는 JSX 로 표현되지 않으며 리팩터 대상이 아니다.
- 라인 65-67: `if (isLoading) return <DiagnosisLoading />;` (early return 1)
- 라인 69-77: `if (isError || questions.length === 0) return <DiagnosisError title="진단 문제를 불러오지 못했습니다." description="네트워크 상태를 확인한 뒤 다시 시도해 주세요." onRetry={() => void refetchQuestions()} />;` (early return 2) — **복합 조건** 이고 `DiagnosisError` 는 `title` · `description` · `onRetry` prop 을 받는다 (`error` prop 이 아님).
- 라인 79-82: derived 값 (`currentQuestion`, `answeredCount`, `isLastQuestion`, `canSubmit`) 이 두 early return **뒤** 에 선언되어 `questions.length > 0` 을 전제로 한다.
- 라인 84-136: 메인 JSX — `<div className="min-h-screen ...">` wrapping div + 고정 배경 blob + `DiagnosisProgressBar` + `DiagnosisQuestionCard` + `DiagnosisNavigation`.

**modal 을 fragment 로 단일 return 에 통합하는 접근은 금지한다**. 이유:
1. derived 값이 guard 뒤에 선언되어 IIFE/함수 추출 없이는 단일 JSX 로 합쳐지지 않는다.
2. `.claude/rules/code-style.md` 가 early return 을 선호한다 ("Early returns — prefer guard clauses over deep nesting").
3. 완료 분기가 side effect 이므로 JSX 표현 대상이 아니다 — `{completed && ...}` 는 불가능.

**올바른 접근 — "modal 변수 재사용" 패턴**:

모달 JSX 를 로컬 `const` 로 선언해 세 return 경로 각각에서 fragment 의 첫 element 로 참조한다. JSX 객체가 아닌 **표현식 참조**이므로 중복 비용이 없고 early-return 구조가 보존된다.

```tsx
export function DiagnosisTest() {
  // ... 기존 훅/상태 선언
  const [showIntroModal, setShowIntroModal] = useState(true);

  const { minutes, seconds, timePercentage, isTimeWarning } =
    useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal);

  // ... 기존 useEffect (isSubmitSuccess → router.push) · useCallback 선언 그대로 유지

  // early return 직전에 선언 — `const` 이므로 재평가 없음
  // key 는 Phase 2 작업 순서 15-d 참조 (fragment sibling 리마운트 방어).
  const introModal = showIntroModal ? (
    <DiagnosisIntroModal
      key="diagnosis-intro-modal"
      onStart={() => setShowIntroModal(false)}
    />
  ) : null;

  if (isLoading) {
    return (
      <>
        {introModal}
        <DiagnosisLoading />
      </>
    );
  }

  if (isError || questions.length === 0) {
    return (
      <>
        {introModal}
        <DiagnosisError
          title="진단 문제를 불러오지 못했습니다."
          description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          onRetry={() => void refetchQuestions()}
        />
      </>
    );
  }

  const currentQuestion = questions[currentIndex];
  // ... 기존 derived 값 그대로

  return (
    <>
      {introModal}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden relative">
        {/* 기존 메인 JSX 그대로 — 배경 blob, DiagnosisProgressBar, DiagnosisQuestionCard, DiagnosisNavigation */}
      </div>
    </>
  );
}
```

**왜 `const introModal = ... ? ... : null` (삼항) 인가**:
- 이 코드는 **JSX 외부** 의 변수 선언이므로 `.claude/rules/code-style.md` 의 "JSX 내 ternary 금지" 규칙과 무관하다. JSX 내부에서는 여전히 `{introModal}` 로 단순 참조만 한다.
- 대안인 `const introModal = showIntroModal && <DiagnosisIntroModal ... />;` 은 동작하지만 `false` 값이 타입에 섞여 `ReactNode` 로 넓어진다. `? ... : null` 이 `ReactElement | null` 로 깔끔하다.

**완료 분기 처리**: 라인 39-43 의 `useEffect(() => { if (isSubmitSuccess && submitResult) router.push(...); }, [...])` 는 **그대로 유지**한다. 이 경로는 JSX 분기가 아니므로 modal 과 독립이며, 리팩터 대상이 아니다. "완료 시 modal 을 숨겨야 하나" 는 고려 불필요 — 완료 시 `router.push` 로 페이지가 바뀌면서 `DiagnosisTest` 자체가 언마운트된다.

**타이머 게이팅과의 정합성**: 모달이 열려 있는 동안 `useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal)` 의 세 번째 인자 `paused` 가 타이머를 막으므로, 로딩 중 모달이 떠 있어도 시간이 흐르지 않는다. 모달을 fetch 완료 조건으로 게이팅 (`showIntroModal && questionsLoaded`) 하지 않아도 시간 누수는 없다.

**리팩터 회귀 체크 (필수, `npm run dev` 수동 확인)**:

1. **첫 진입 (`isLoading === true`)**: modal 이 로딩 스피너 위에 노출되는가. 로드 완료 후 동일한 `introModal` 참조가 메인 JSX 위로 전이되며 **modal DOM 이 리마운트되지 않는가** (React reconciliation 이 같은 참조를 유지해야 정상).
2. **에러 상태 (`isError || questions.length === 0`)**: modal 이 에러 카드 위에 떠 있는가. 정책상 "에러 시 modal 숨김" 이 필요하면 `const introModal = showIntroModal && !(isError || questions.length === 0) ? (...) : null;` 로 가드. **기본값은 "modal 유지"** (에러 상태에서 사용자가 재시도 버튼을 누르기 전에 안내 문구가 보이는 편이 자연스러움).
3. **modal 닫기**: "시작하기" 클릭 → `showIntroModal = false` → `introModal = null` → 세 return 경로 모두 fragment 의 첫 element 가 사라짐 → 메인 JSX 만 남고 layout shift 없음 (배경 blob 과 본문은 이미 `fixed` / `relative z-10` 이므로 위치 보존).
4. **완료 분기**: 모든 답변 → `handleSubmit` → `isSubmitSuccess` → `useEffect` 에서 `router.push` → 페이지 언마운트. modal 유무와 무관.

**CSS 전략 (필수)**: 인라인 블록 렌더는 금지한다. 모달 최상위 컨테이너는 다음 클래스 조합으로 **뷰포트 고정 오버레이**가 되어야 한다:

```tsx
<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
  <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-purple-100">
    {/* 문구 + 시작하기 버튼 */}
  </div>
</div>
```

이유: `diagnosis-test.tsx:85` 의 루트는 이미 `relative` 이고 `z-10` 의 본문이 그 위에 쌓여 있다. 모달을 인라인 블록으로 렌더하면 `DiagnosisProgressBar` 앞에 일반 블록을 차지해 **§2-A 의 여백 보정을 무효화하는 layout shift** 가 발생한다. `fixed inset-0 z-50` 으로 본문 플로우에서 분리되어야 하며, `z-50` 은 루트의 `z-10` 본문과 `fixed` 배경 blob(`z` 없음)보다 항상 위에 있어야 한다.

**타이머 일시정지 (필수)**: `features/diagnosis/hooks/use-diagnosis-timer.ts` 를 **세 번째 인자** `paused: boolean` 을 받도록 확장한다. `paused === true` 면 `setInterval` 시작 자체를 스킵한다. `diagnosis-test.tsx` 에서는 `useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal)` 로 호출해 모달이 열려 있는 동안 카운트다운을 막는다.

이 단계가 없으면 사용자가 모달을 읽는 동안(체감 5–15초) 제한시간이 조용히 깎여 Phase 3 rollback 트리거 ("진단 이탈률 30% 증가") 가 힌트 제거/distractor 난이도 때문이 아닌 **모달 타이머 누수만으로 발화**할 수 있고, rollback 근거가 오염된다. 구현 형태 (동일 PR 내):

```typescript
// features/diagnosis/hooks/use-diagnosis-timer.ts
/**
 * 진단 카운트다운 타이머.
 *
 * ⚠️ `paused` 시맨틱 주의: 이 인자는 "멈춤/재개" 가 아니라 **"시작 지연/리셋"** 이다.
 * - `paused: true` 로 마운트되면 setInterval 이 시작되지 않는다.
 * - `paused: true → false` 로 전환되면 effect 가 재실행되며 `startTime = Date.now()`
 *   를 새로 캡처한다. 즉 **경과 시간이 보존되지 않고 처음부터 다시 카운트**된다.
 * - `paused: false → true → false` 의 왕복을 호출부가 수행하면 매번 `initialSeconds`
 *   가 전부 재충전된다 → 시간 누수 위험. 현재는 `DiagnosisIntroModal` 1회성
 *   진입에만 쓰이므로 안전하지만, 중간 일시정지/재개 기능을 붙이려면 이 훅을
 *   "경과 시간 보존" 버전으로 재설계해야 한다.
 *
 * ⚠️ `onExpire` 는 ref 로 latest 캡처: dependency 배열에 `onExpire` 를 넣지 않는다.
 * - 호출부의 `handleSubmit` 이 `useCallback` 으로 안정화되어 있지 않을 수 있는데,
 *   dependency 에 `onExpire` 를 추가하면 매 렌더마다 effect 가 재실행되어
 *   `startTime = Date.now()` 가 재캡처된다 → "한 번 시작하면 끝까지 이어간다" 의도
 *   파괴. 반대로 dependency 를 비우면 stale closure 의 `answersById` 로 제출되는
 *   silent 회귀가 발생한다.
 * - 따라서 `onExpireRef = useRef(onExpire)` + 별도 effect 로 ref 를 최신 값으로
 *   동기화하고, 메인 effect 의 setInterval 내부에서는 `onExpireRef.current()` 를
 *   호출한다. 이 패턴이 "타이머 구간을 건드리지 않고 콜백만 최신" 을 보장한다.
 */
export function useDiagnosisTimer(
  initialSeconds: number,
  onExpire: () => void,
  paused: boolean = false
) {
  const onExpireRef = useRef(onExpire);

  // 1. onExpire 가 바뀔 때마다 ref 만 업데이트 (타이머 effect 와 독립)
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // 2. 실제 타이머 effect: onExpire 에 의존하지 않음
  useEffect(() => {
    if (paused) return;
    if (initialSeconds <= 0) { /* ... */ }
    // 기존 setInterval 로직 (startTime = Date.now() 을 effect 내부에서 캡처)
    // 만료 시점 호출: onExpire() 가 아니라 onExpireRef.current() 로 latest 보장
  }, [initialSeconds, paused]);
}
```

`paused` 가 `true` → `false` 로 전환될 때 `initialSeconds` 는 변하지 않지만 effect 가 재실행되어 타이머가 처음부터 시작된다. 이 동작은 "모달 닫힘 = 타이머 시작" 의도와 일치한다. `onExpire` 의 최신 값은 ref 경로로 매 렌더 반영되므로 stale closure 회귀 없이 타이머 구간을 건드리지 않는다. 위 JSDoc 블록을 `use-diagnosis-timer.ts` 파일 상단에 **반드시 포함**시켜 후속 개발자의 "pause/resume 기능" 오용 및 "`onExpire` 를 dependency 에 추가" 오용을 모두 차단한다.

**문구** (초안): "정확한 레벨 측정을 위해 힌트 없이 진행됩니다. 모르는 문항도 건너뛰지 말고 가장 그럴듯한 답을 선택해 주세요. 시작하기 버튼을 누르면 제한시간이 시작됩니다."

**닫기 버튼 라벨**: "시작하기"

#### 2-C. 기존 사용자 마이그레이션 (필수)

**문제**: `shared/lib/diagnosis-guards.ts:77-92` 의 `preventDiagnosisRetake` 가 30일 쿨다운을 적용한다. Phase 2 배포 시점에서 최근 30일 내 진단한 사용자는 **힌트로 부풀려진 CEFR 레벨**이 `LevelDiagnosis.cefrLevel` 및 `UserProfile.level` (실제 컬럼명은 `level`; `prisma/schema.prisma:86` 참조) 에 잠긴 채로 남는다. Phase 3 임계값 재보정 후에도 기존 기록은 옛 기준으로 해석된 채 남아 **두 모집단이 이질적인 점수 체계로 공존**한다.

**해결**: 다음 두 가지를 Phase 2 동일 PR 에서 함께 수행한다.

1. **`LevelDiagnosis.scoringVersion` 필드 추가**
   - `prisma/schema.prisma` 의 `LevelDiagnosis` 에 `scoringVersion Int @default(1)` 추가
   - `npx prisma migrate dev --name add_diagnosis_scoring_version`
   - **Prisma 클라이언트 재생성**: 마이그레이션 직후 `rm -rf lib/generated/prisma && npx prisma generate` 를 **반드시** 실행한다. `.claude/memory/MEMORY.md` 에 명시된 알려진 함정으로, `lib/generated/prisma/models/` 의 타입이 stale 상태로 남아 `scoringVersion` 필드가 TS 타입에 반영되지 않을 수 있다. 이 단계를 건너뛰면 다음 단계에서 `Object literal may only specify known properties` TS 에러로 막힌다.
   - **기존 `shared/constants/diagnosis.ts` 파일에** `export const CURRENT_SCORING_VERSION = 2;` 를 추가한다 (기존 `DIAGNOSIS_TIME_LIMIT_SECONDS` 옆). `shared/constants/index.ts` 의 barrel 에도 재수출 항목 추가.
     - **왜 `features/diagnosis/config/` 가 아닌 `shared/constants/` 인가**: `shared/lib/diagnosis-guards.ts` (bypass 판정) 와 `app/api/diagnosis/submit/route.ts` (저장 경로) 둘 다 이 상수를 참조해야 한다. FSD 계층 규칙상 `shared` 계층은 `features` 계층을 import 할 수 없으므로 (`.claude/rules/architecture.md` 의 unidirectional flow), `features/diagnosis/config/` 를 단일 출처로 두면 `diagnosis-guards.ts` 가 FSD 를 위반하게 된다. **가장 낮은 공통 조상 계층**인 `shared/` 에 두어야 `shared/lib/` (동일 계층) 와 `app/api/` · `features/diagnosis/` (상위 계층) 가 모두 순방향으로 import 할 수 있다.
     - `shared/constants/diagnosis.ts` 는 이미 순수 상수 파일이며 `"use server"` 디렉티브가 없으므로 client/server 양쪽에서 안전하게 import 된다.
     - `features/diagnosis/config/index.ts` 에서 필요 시 `export { CURRENT_SCORING_VERSION } from "@/shared/constants";` 로 **재수출은 허용** (상위→하위 방향, FSD 준수). 단 원본은 `shared/` 에만 존재한다.
   - 진단 결과 저장 경로 (`app/api/diagnosis/submit/route.ts` 의 `prisma.levelDiagnosis.create`) 에서 `import { CURRENT_SCORING_VERSION } from "@/shared/constants";` 후 `scoringVersion: CURRENT_SCORING_VERSION` 을 명시 저장한다. schema default 는 예비 안전망으로만 존재하며, 신규 진단은 반드시 소스 코드에서 버전을 주입한다.
   - 기존 레코드는 default 로 자동 `1` 로 채워진다. Backfill 불필요.
   - Phase 3 재보정은 `scoringVersion >= CURRENT_SCORING_VERSION` 표본에만 적용. 기존 `scoringVersion: 1` 레코드는 옛 기준으로 의미 보존.

2. **레거시 사용자 쿨다운 bypass + `needsRediagnosis` 클라이언트 노출**
   - **`"use server"` 제약 사전 경고 (필수)**: `shared/lib/diagnosis-guards.ts:1` 은 `"use server"` 디렉티브로 시작하는 **Server Actions 모듈**이다. Next.js 규약상 이 파일의 모든 named export 는 **async function** 이어야 한다. 본 단계의 타입 확장을 구현할 때 반드시 지켜야 할 제약:
     - ✅ 허용: 상수 `import`, 함수 내부 return 타입 추론 변경 (inferred return type 으로만 `needsRediagnosis: boolean` 필드 추가)
     - ❌ 금지: 같은 파일에서 `export interface DiagnosisStatusResult { ... }` 같은 **type/interface export** 추가. 빌드가 즉시 깨진다.
     - ❌ 금지: `shared/lib/index.ts` 배럴에 `diagnosis-guards.ts` 함수/상수를 재수출 (`.claude/memory/MEMORY.md` 의 "server-only 금지" 규칙 — 클라이언트 컴포넌트 빌드가 깨진다).
     - 별도 타입 export 가 필요하면 `entities/diagnosis/types.ts` 등 **다른 파일** 에 두고 `diagnosis-guards.ts` 는 해당 타입을 import 해 함수 시그니처에서만 사용한다.
   - `shared/lib/diagnosis-guards.ts` 상단에 `import { CURRENT_SCORING_VERSION } from "@/shared/constants";` 추가 (FSD 상 동일 계층 참조이므로 위반 없음 — import 는 export 가 아니므로 `"use server"` 제약과도 무관).
   - `shared/lib/diagnosis-guards.ts` 의 `checkDiagnosisStatus` 의 `prisma.levelDiagnosis.findFirst` select 에 `scoringVersion: true` 를 **반드시** 추가한다. 현재 select 는 `{ id, completedAt, cefrLevel }` 이라 scoringVersion 이 빠져 있어, 추가하지 않으면 bypass 판정 자체가 불가능하다. 이 한 줄 누락이 Phase 2 전체 마이그레이션 전략을 조용히 무효화할 수 있으므로 Implementation Plan 에 별도 단계로 명시한다.
   - `checkDiagnosisStatus` 반환 타입에 `needsRediagnosis: boolean` 을 추가한다. 판정 규칙: **`latestDiagnosis !== null && latestDiagnosis.scoringVersion < CURRENT_SCORING_VERSION`** (명시적 null 체크 필수). `hasCompleted && latestDiagnosis.scoringVersion < ...` 형태로 쓰면 TypeScript 가 `hasCompleted: boolean` 의 truthiness 로 동일 객체의 `latestDiagnosis: ... | null` 을 non-null 로 좁히지 않아 "Object is possibly 'null'" 컴파일 에러가 발생한다. `latestDiagnosis === null` 인 경우(= `hasCompleted === false`) 는 `false` 를 반환하므로 사실상 의미가 동일하다.
   - `preventDiagnosisRetake` 를 수정하여 `needsRediagnosis === true` 사용자는 쿨다운을 무시하고 재진단을 허용한다.
   - **클라이언트 API 노출 (필수)**: `needsRediagnosis` 를 서버 내부에만 두지 말고 다음 두 지점까지 함께 노출한다. 서버 bypass 만 구현하고 클라이언트 노출을 누락하면 후속 "재진단 가능 배너" 작업이 추가 plumbing (라우트 응답 + 타입 + 쿼리 키 무효화) 을 더 해야만 시작 가능해져 "API 만 준비" 라는 본 RFC 의 약속이 미완으로 남는다.
     - `app/api/diagnosis/status/route.ts` 의 응답 JSON 에 `needsRediagnosis` 필드를 추가한다. 현재 응답은 `{ hasCompleted, cefrLevel, completedAt, canRetake, daysUntilRetake }` 이며 `checkDiagnosisStatus` 의 destructure 에 `needsRediagnosis` 를 추가해 그대로 반환한다.
     - `features/diagnosis/api/diagnosis-api.ts` 의 `DiagnosisStatusResponse` 인터페이스에 `needsRediagnosis: boolean` 필드를 추가한다.
     - 클라이언트 `useDiagnosisStatus` 훅은 이미 `DiagnosisStatusResponse` 를 그대로 반환하므로 훅 자체 수정은 불필요하다. 쿼리 키 (`queryKeys.diagnosis.status()`) 도 변경 없음.
   - 사용자는 원할 때 재진단해 신규 점수 체계로 갱신할 수 있다. 강제 재진단은 아니다.
   - 홈 화면 "더 정확한 레벨 측정을 위해 재진단이 가능합니다" 배너 UI 자체는 후속 작업 허용. 본 RFC 는 배너가 데이터를 소비할 수 있도록 **서버→API→타입** 경로를 끝까지 연결해 두기만 한다.

### 변경하지 않는 것 (의도적 제외)

- **`DiagnosisQuestion` 타입**: `entities/question/types.ts:20` 의 `koreanHint` 필드는 `BaseQuestion` 에 정의되어 `QuizQuestion` 이 상속한다. 제거하면 퀴즈가 깨진다.
- **`features/diagnosis/lib/question-generator.ts:28`**: 여전히 `koreanHint` 를 DB에서 매핑한다. UI에서는 미사용 데드 필드가 되지만, 페이로드 최적화는 별도 RFC 범위 (YAGNI).
- **`features/diagnosis/lib/scoring.ts` 계산 로직 자체**: 힌트 사용과 무관하므로 점수 산출 알고리즘은 그대로 둔다. Phase 3 에서는 **상수값**(`mapScoreToCEFR` 임계값, `analyzeWeaknesses` 60% 임계값, `getRecommendedLevel` ≥3 조건)만 조정한다.
- **진단 submit API 의 요청 스키마는 Phase 0-A 에서 변경된다** (`isCorrect: boolean` → `selectedText: string`). 응답 스키마는 그대로. Phase 2 는 그 위에서 진행되므로 "Phase 2 범위에서는 API 계약 추가 변경 없음". 단 `LevelDiagnosis.scoringVersion` 은 서버 내부 저장용 필드로 클라이언트 노출 불필요.
- **GET `/api/diagnosis/start` · `/api/quiz/daily` 응답의 option 필드**: Phase 0-A 에서 `isCorrect` 가 제거된다 (`{ text, isCorrect }` → `{ text }`). Phase 2 이후 추가 변경 없음.
- **`features/quiz/ui/game/quiz-question.tsx:142`**: 퀴즈의 Level 2 한국어 힌트는 유지 (설계 의도).

### Phase 3 — CEFR 임계값 & 약점 로직 재보정

**대상** (세 지점을 동시에 재검토):

1. `features/diagnosis/lib/scoring.ts:32-39` 의 `mapScoreToCEFR` 점수 임계값 (96/81/61/41/21)
2. `features/diagnosis/lib/scoring.ts:62` 의 `analyzeWeaknesses` category 정확도 임계값 (60%)
3. `features/diagnosis/lib/scoring.ts:67` 의 `getRecommendedLevel` 약점 3개 하향 조건

**왜 세 개 모두?**: 힌트 제거 후 전체 평균 점수뿐 아니라 **category별 정확도도 일괄 하락**한다. 60% 임계값과 ≥3 조건을 그대로 두면 대부분 사용자가 약점 3개 이상으로 분류되어 `mapScoreToCEFR` 결과가 추가로 한 단계 더 내려가는 **연쇄 하향**이 발생한다. `mapScoreToCEFR` 만 조정하면 약점 로직의 오버라이드가 남아 원하는 분포를 얻을 수 없다.

#### 수집 방법

1. Phase 2 배포 후 `scoringVersion: 2` 진단 데이터만 수집 (기존 `scoringVersion: 1` 은 제외)
2. **독립 사용자 최소 10명**이 각각 **1회씩** 진단. 같은 사용자의 반복 측정은 학습 효과로 점수를 과대 추정하므로 배제한다.
3. 각 진단의 `totalScore`, category별 정확도, 체감 실제 레벨을 스프레드시트에 기록.
4. 표본 10명 미달이면 기한 연장. 완료 기한은 **Phase 2 배포 후 최대 4주** 이내.

#### 조정 기준

- **`mapScoreToCEFR`**: 분포가 상·하단으로 쏠리면 임계값을 보수적으로 ±5 이내 조정.
- **`analyzeWeaknesses` 임계값 (60%)**: 평균 category 정확도가 기존 대비 크게 하락해 대부분 category 가 weakness 로 플래그되면 50%~55% 로 하향 검토.
- **`getRecommendedLevel` 약점 개수 (≥3)**: 사용자의 80% 이상이 약점 3개 이상으로 분류되면 ≥4 로 상향.

#### 완료·Rollback 기준

- **완료 기준**: 조정 후 신규 진단 10건 중 **체감 레벨 일치율 70% 이상**. 달성 시 Phase 3 를 종료한다.
- **Rollback 트리거**: Phase 2 배포 후 2주 이내에 (a) 진단 이탈률이 기존 대비 30% 이상 증가하거나, (b) CEFR 분포가 A1 60% 이상으로 쏠리면 Phase 2 를 rollback 한다.
- **Rollback 범위 (정확히 이 네 가지만 revert)**:
  1. `features/diagnosis/ui/flow/diagnosis-question-card.tsx` 의 한국어 힌트 JSX 및 여백 수치 원복.
  2. `diagnosis-test.tsx` 의 `DiagnosisIntroModal` 조건부 렌더 제거 (컴포넌트 파일은 삭제 허용). 아울러 `showIntroModal` state 제거 및 `useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal)` 호출을 `useDiagnosisTimer(timeLimit, handleSubmit)` 2-인자 형태로 원복. `use-diagnosis-timer.ts` 의 `paused` 파라미터 시그니처 자체는 **유지** (기본값 `false` 덕분에 2-인자 호출이 그대로 동작, 재적용 시 재활용).
  3. `app/api/diagnosis/submit/route.ts` 의 `scoringVersion: CURRENT_SCORING_VERSION` 명시 저장 제거. 이후 신규 진단은 schema default `1` 로 저장되어 기존 `scoringVersion: 1` 모집단에 합류한다.
  4. `shared/lib/diagnosis-guards.ts` 의 `needsRediagnosis` 계산 및 `preventDiagnosisRetake` bypass 로직 제거. `checkDiagnosisStatus` select 의 `scoringVersion: true` 는 부작용 없으므로 유지해도 무방.
- **Rollback 범위 외 (반드시 유지)**:
  - **Phase 0-A 서버 측 정답 판정은 유지한다**. `diagnosisAnswerSchema` 의 `selectedText` 스키마, `format-answers.ts` 의 서버측 재배치, `/api/diagnosis/submit` 의 DB 재조회 채점 경로, 응답 페이로드의 `isCorrect` 제거는 모두 Phase 2 와 독립적인 **보안/데이터 정합성 수정**이다. rollback 해도 client-trust exploit 가 다시 열리는 회귀는 받아들일 수 없다.
  - **Phase 0-B 옵션 셔플은 유지한다**. position bias 제거는 Phase 2 와 독립적인 데이터 정합성 수정이며, rollback 해도 퀴즈·진단 양쪽에서 "A만 누르기 exploit" 가 다시 열리는 회귀는 받아들일 수 없다.
  - **`LevelDiagnosis.scoringVersion` 컬럼 자체는 drop 하지 않는다**. 재적용 가능성을 위해 비파괴적으로 보존한다. 다운 마이그레이션은 destructive 작업이고, 이미 `scoringVersion: 2` 로 저장된 레코드가 소수라도 있다면 정보 손실이 발생한다.
  - **Phase 1 distractor 개편은 유지한다**. 퀴즈 Level 0 품질 이득은 Phase 2 와 독립적으로 성립한다.
  - **`shared/constants/diagnosis.ts` 의 `CURRENT_SCORING_VERSION` 상수는 유지한다**. 재적용 시 단일 출처가 필요하다. 단 재적용 시 값 처리는 아래 "재적용 프로토콜" 을 따른다.
  - **선행 migration 으로 추가한 `QuizOption` 의 `@@unique([questionId, order])` 제약은 유지한다**. 이는 Phase 2 와 무관한 데이터 정합성 개선이다.
- **재적용 프로토콜 (pocket record 격리)**: rollback 이후 Phase 2 를 다시 시도할 때는 `CURRENT_SCORING_VERSION` 을 **반드시 `3` 이상으로 상향**한 뒤 재배포한다. 이유: rollback 이전 Phase 2 기간 (최대 2~4주) 에 저장된 `scoringVersion: 2` 레코드들은 rollback 을 유발한 문제 많은 환경에서 수집된 표본이다. `CURRENT_SCORING_VERSION` 을 `2` 그대로 두고 재시도하면 Phase 3 의 `scoringVersion >= CURRENT_SCORING_VERSION` 필터가 이 "pocket" 레코드를 재보정 표본에 포함시켜 임계값 결정이 오염된다. `3` 으로 상향하면 자연스럽게 격리된다. Phase 3 `phase-3-calibration-snapshot.md` 에 "scoringVersion 2 는 폐기된 pocket" 으로 한 줄 기록.
- Phase 3 는 반드시 Phase 2 와 **별도 커밋/PR**.

## Implementation Plan

### Phase 0 작업 순서

Phase 0-A (서버 측 정답 판정) 와 Phase 0-B (옵션 셔플) 는 **동일 PR 내에서 순차적으로** 적용한다. 순서 분리 시 중간 커밋에서 진단이 깨지므로 단일 원자 커밋을 목표로 한다.

#### Phase 0-A — 서버 측 정답 판정으로 이전

1. **정답 판정 경로 사전 확인 (grep)**: 다음 두 경로가 실제로 Phase 0-B 셔플에 대해 안전한지 재확인한다.
   - `features/diagnosis/lib/format-answers.ts:11` 이 `option.text === answersById[question.id]` 형태로 option.text 기반 비교인지 (이미 그렇다).
   - `features/quiz/ui/game/quiz-question.tsx` 내부가 `selectedAnswer === option.text` 기반 선택 추적만 하는지. `option.isCorrect` / 배열 인덱스 / `order` 필드에 의존하는 렌더 경로가 있으면 Phase 0-A 범위에서 함께 수정.
   - `features/quiz/ui/result/quiz-detail-results.tsx` 의 `item.isCorrect` 사용처가 `/api/quiz/submit` 응답의 필드인지 (옵션 GET 응답의 필드가 아님) grep 으로 재확인.
2. **`shared/constants/diagnosis.ts` 수정 (스키마 선행 의존성)**: `export const TOTAL_DIAGNOSIS_QUESTION_COUNT = 20;` 를 추가한다 (기존 `DIAGNOSIS_TIME_LIMIT_SECONDS` 옆). `shared/constants/index.ts` 의 `export { DIAGNOSIS_TIME_LIMIT_SECONDS } from "./diagnosis";` 줄을 `export { DIAGNOSIS_TIME_LIMIT_SECONDS, TOTAL_DIAGNOSIS_QUESTION_COUNT } from "./diagnosis";` 로 in-place 갱신한다. 이 상수가 3 단계의 zod `.length(...)` 에서 참조된다.
   - **FSD 근거**: `entities/question/lib/schemas.ts` 가 이 상수를 참조하므로 `features/` 가 아닌 `shared/` 에 두어야 역방향 import 를 방지한다.
   - **drift 방지**: `features/diagnosis/config/index.ts` 에 `import { TOTAL_DIAGNOSIS_QUESTION_COUNT } from "@/shared/constants";` 후 `if (QUESTION_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0) !== TOTAL_DIAGNOSIS_QUESTION_COUNT) throw new Error("TOTAL_DIAGNOSIS_QUESTION_COUNT drift");` 런타임 assert 추가.
3. **`entities/question/lib/schemas.ts` 수정**: `diagnosisAnswerSchema` 를 `{ questionId: z.string().min(1), selectedText: z.string() }` 로 **축소**한다.
   - **`isCorrect` · `difficulty` · `category` 세 필드 모두 제거**. 클라이언트가 주장할 수 있는 면적을 최소화해 가중치 조작 우회 경로를 원천 봉쇄한다.
   - **`selectedText` 에 `.min(1)` 을 붙이지 않는다**. 붙이면 `useDiagnosisTimer` 만료 시 자동 제출된 미답변 문항 (`selectedText: ""`) 이 400 으로 거부되어 진단 결과 발급이 실패한다. 빈 문자열은 서버측 `formatDiagnosisAnswers` 에서 "정답 매칭 없음 → `isCorrect: false`" 로 자연 처리된다.
   - `diagnosisSubmitRequestSchema` 의 배열 검증을 다음 두 가지로 강화한다:
     - `.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` — 2 단계의 상수 import 필수. 1개 답변만 보내서 `maxPossibleScore` 분모를 조작해 100% 를 달성하는 exploit 를 차단.
     - `.refine((arr) => new Set(arr.map((a) => a.questionId)).size === arr.length, "Duplicate questionId")` — 같은 문항 × 20 반복 payload 로 가중치를 부풀리는 exploit 를 차단.
4. **`entities/question/types.ts` 수정**: `QuestionOption` 인터페이스에서 `isCorrect: boolean` 필드를 제거한다 (API 경계 타입이므로). `DiagnosisSubmitAnswer` 타입을 `{ questionId: string; selectedText: string }` 로 **최소 필드만** 가지도록 추가한다. `difficulty` · `category` 를 **의도적으로 담지 않는다** — 와이어 타입에 없으면 클라이언트가 주장할 수도 서버가 실수로 읽을 수도 없다. `DiagnosisAnswer` (서버 내부, `{ questionId, difficulty, category, isCorrect }`) 는 그대로 유지.
5. **`features/diagnosis/lib/format-answers.ts` 수정**: 시그니처를 다음과 같이 재배치한다. 입력: `(dbQuestions: Prisma.QuizQuestionGetPayload<{ include: { options: true } }>[], submitAnswers: DiagnosisSubmitAnswer[])`. 출력: `DiagnosisAnswer[]`.
   - 본문은 `dbQuestions` 를 `Map<questionId, DbQuestion>` 로 인덱싱한 후 `submitAnswers` 를 순회하면서 `dbQuestion.difficulty` · `dbQuestion.category` · `dbQuestion.options.find((o) => o.isCorrect)?.text === submitted.selectedText` 로 `DiagnosisAnswer` 를 구성한다.
   - **불변 조건 (필수)**: 본문 어디에서도 `submitted.difficulty` · `submitted.category` 문자열이 등장하지 않는다. 현재 와이어 타입에 두 필드가 없으므로 자연히 강제되지만, 장래 필드가 다시 추가되더라도 이 규칙을 유지한다. 코드 리뷰 체크리스트 항목으로 명시.
   - `dbQuestion` 이 `undefined` (questionId 가 Map 에 없음) 면 `throw new Error("Unknown questionId")` — 라우트에서 사전 검증되지만 방어적 이중 체크.
6. **`features/diagnosis/lib/index.ts` barrel 에서 `formatDiagnosisAnswers` export 제거**. 서버 경로에서만 직접 import.
7. **`features/diagnosis/hooks/use-diagnosis-quiz.ts` 수정**: `formatDiagnosisAnswers` import 제거. 제출 payload 구성을 `answers: questions.map((q) => ({ questionId: q.id, selectedText: answersById[q.id] ?? "" }))` 로 변경한다.
   - `difficulty` · `category` 는 payload 에 포함하지 않는다 (와이어 타입이 허용하지 않음).
   - `answersById[q.id] ?? ""` 의 빈 문자열 fallback 은 **의도적으로 유지**한다. 서버 스키마의 `z.string()` 이 이를 허용하며, 미답변 문항은 서버에서 `isCorrect: false` 로 자연 처리된다. 이 덕분에 시간 초과 자동 제출 경로(`useDiagnosisTimer` 만료 → `handleSubmit`) 에서도 일부 답변 누락 시 400 회귀가 발생하지 않는다.
   - **클라이언트는 더 이상 정답 여부·난이도·카테고리 어떤 것도 판단·주장하지 않는다**.
8. **`app/api/diagnosis/submit/route.ts` 수정**:
   - `validation.success` 분기 이후 `const questionIds = validation.data.answers.map((a) => a.questionId);`
   - `const dbQuestions = await prisma.quizQuestion.findMany({ where: { id: { in: questionIds } }, include: { options: true } });`
   - **DB 재조회 길이 검증 (필수)**: `if (dbQuestions.length !== validation.data.answers.length) return NextResponse.json({ error: "존재하지 않는 questionId 가 포함되어 있습니다" }, { status: 400 });` — zod 가 중복·총합·유일성을 모두 막지만, 존재하지 않는 questionId 가 섞인 경우는 여기서만 잡을 수 있다.
   - `const scoredAnswers = formatDiagnosisAnswers(dbQuestions, validation.data.answers);` (서버 내부 판정, `difficulty` · `category` 모두 DB 기반)
   - 기존 `calculateDiagnosisScore(answers)` 를 `calculateDiagnosisScore(scoredAnswers)` 로 교체.
9. **`features/diagnosis/lib/question-generator.ts` 수정**: 옵션 매핑에서 `isCorrect: opt.isCorrect` 필드를 제거. 응답 옵션은 `{ text: opt.text }` 만 포함.
10. **`app/api/quiz/daily/route.ts` 의 `createQuizQuestionResponse` 수정**: 옵션 매핑에서 `isCorrect` 제거. 관련 `QUIZ_QUESTION_OPTION_SELECT` / 응답 타입도 함께 축소.
11. `npx tsc --noEmit` — 위 변경이 타입 전반에 파급되므로 컴파일 오류를 모두 수정. 주 충돌 예상 지점: `DiagnosisQuestion` 관련 client 컴포넌트가 `option.isCorrect` 를 읽던 사용처 (없어야 정상).

#### Phase 0-B — 응답 옵션 셔플

12. `features/diagnosis/lib/question-generator.ts`: 기존 `options: q.options.map(...)` 를 **`options: shuffleArray(q.options).map(...)`** 로 교체한다. `shuffleArray` 는 이미 파일 상단에서 import 되어 있다 (`shuffleArray(rows)` / `shuffleArray(questions)` 호출부 참고). **`shuffleArray` 는 새 배열을 반환하므로 반드시 `.map(...)` 체이닝으로 반환값을 사용**한다. `shuffleArray(q.options); q.options.map(...)` 형태는 no-op 이 되어 셔플이 적용되지 않은 원본이 그대로 응답된다 — 컴파일·lint 는 통과하므로 발견이 늦다.
13. `app/api/quiz/daily/route.ts`: `createQuizQuestionResponse` 내부 `question.options.map(...)` 를 **`shuffleArray(question.options).map(...)`** 로 교체. `shuffleArray` 는 이미 파일 상단에서 import 되어 있다. 반환값 사용 필수.

#### 검증 및 커밋

14. `npx tsc --noEmit` / `npm run lint` / `npm run build` 통과.
15. `npm run dev` 로 수동 확인 (Phase 0-A 와 Phase 0-B 를 합친 종합 검증). **아래 7개 시나리오를 모두 실행**해 exploit 우회 경로가 전부 막혔는지 확인한다:
    - **(a) 초안 exploit 차단**: DevTools Console 에서 `fetch('/api/diagnosis/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: Array.from({ length: 20 }, () => ({ questionId: 'fake', difficulty: 'A1', isCorrect: true, category: 'daily', selectedText: 'x' })) }) })` → **400** (`difficulty`/`category`/`isCorrect` unknown key 또는 dbQuestions.length mismatch).
    - **(b) 중복 questionId exploit 차단**: 같은 questionId × 20 payload 로 정답 텍스트만 포함해 제출 → **400** (`.refine` duplicate questionId).
    - **(c) 소수 답변 exploit 차단**: `answers.length === 1` 로 정답 하나만 제출 → **400** (`.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` 위반).
    - **(d) difficulty 조작 무력화**: 스키마가 `difficulty` 를 거부하므로 (a) 에서 자동 차단. 추가로 서버 측 파일에 `submitted.difficulty` / `submitAnswer.difficulty` 문자열이 등장하지 않음을 grep 으로 확인 (`grep -rn "submitted\.difficulty\|submitAnswer\.difficulty" app/ features/`).
    - **(e) 시간 초과 자동 제출 정상 경로 (회귀 체크)**: 진단 진입 후 20문항 중 5개만 답하고 나머지는 답하지 않은 상태로 5분 타이머 만료 대기. 자동 `handleSubmit` 이 호출되어 15개 문항이 `selectedText: ""` 로 전송됨 → **200 OK 로 수용**되고 totalScore 가 "답한 5개 중 정답 수" 에 비례해 정상 계산. **400 으로 거부되면 회귀**. 시간 제약상 `timeLimit` 을 임시 5초로 낮춰 테스트해도 무방 (`shared/constants/diagnosis.ts` 의 `DIAGNOSIS_TIME_LIMIT_SECONDS` 일시 수정 후 복구).
    - **(f) 정상 정답 경로**: 진단을 UI 로 끝까지 수행해 정답만 20개 선택 → `totalScore: 100`. 오답만 20개 선택 → `totalScore: 0`.
    - **(g) 존재하지 않는 questionId**: 정상 payload 에서 한 문항의 questionId 만 `'fake-id'` 로 바꿔 제출 → **400** (`dbQuestions.length !== submitAnswers.length`).
    - **(h) Phase 0-B 셔플 회귀 테스트**: 진단 20문항을 **3회 연속** 시작해 각 문항의 **정답 선택지가 회마다 A/B/C/D 중 다른 위치** 에 노출되는지 확인. 문항 순서 셔플 (이미 동작 중) 과 혼동하지 말 것.
    - **(i) 퀴즈 데일리 회귀**: 퀴즈 데일리도 3회 반복해 옵션 position 변동 확인 및 제출 시 정상 채점 확인.
16. 커밋: `fix(quiz) : server-side answer validation and shuffle to eliminate cheating exploits`
17. Phase 0 PR 을 먼저 머지한 후에만 Phase 1 PR 을 시작한다.

### Phase 1 작업 순서

1. **선행 스키마 보강 (분리 commit)**: `prisma/schema.prisma` 의 `QuizOption` 에 `@@unique([questionId, order])` 를 추가한다.
2. `npx prisma migrate dev --name add_quiz_option_unique` 실행. 개발 DB 에 이미 중복 `(questionId, order)` 가 있으면 migration 이 실패한다 → 실패 시 수동으로 중복 해소 후 재실행. 실패는 정상 동작 (데이터 정합성 복구 기회).
3. `rm -rf lib/generated/prisma && npx prisma generate` (stale 타입 방지, `.claude/memory/MEMORY.md` 가이드)
4. 커밋: `fix(db) : enforce unique QuizOption(questionId, order)`
5. `prisma/seed-quiz.ts` 의 A1/A2 101문항을 훑으며 **교체 규칙 1–5** 위반 여부를 스프레드시트에 기록한다.
6. 위반 문항에 대해 distractor 교체안을 결정한다. LLM assist 허용, 단 결과는 규칙 2·3 자동 assert 로 필수 검증.
7. `prisma/fix-a1-a2-distractors.ts` 작성:
   - 스크립트 상단에 **음성 예외 whitelist** 하드코딩 (`hour`, `honor`, `honest`, `heir`, `herb`, `university`, `uniform`, `unique`, `useful`, `user`, `usual`, `European`, `one`, `once`).
   - `startsWithVowelSound(word)` 헬퍼를 whitelist 우선 → 철자 정규식 fallback 순서로 구현.
   - `assertArticleAgreement` / `assertCountability` 헬퍼를 `startsWithVowelSound` 기반으로 구현.
   - **교체 목록 데이터 형태**: `{ englishWord: string, sentence: string, replacements: { order: 2 | 3 | 4, newText: string }[] }` 배열. `questionId` 는 **절대 등장하지 않는다** (cuid 는 환경마다 다르므로 하드코딩 금지).
   - **문항 식별 2-step lookup (필수) + 다중 매칭 가드**: 각 교체 항목에 대해 먼저 `prisma.quizQuestion.findMany({ where: { englishWord, sentence }, select: { id: true } })` 로 매칭 행을 조회한다. **`result.length === 1` 을 명시적으로 assert** — 0 이면 미매칭, 2+ 면 시드 dedup 가정 붕괴 (e.g. 수동 INSERT 에 의한 중복). 둘 다 즉시 `throw` 로 트랜잭션 rollback. 이 가드는 RFC 가 `@@unique([questionId, order])` 로 옵션 측 유일성을 DB 레벨 보장하는 것에 비해 질문 측 `(englishWord, sentence)` 키는 **DB 제약이 없고 시드 런타임 dedup 에만 의존** 하는 비대칭을 방어한다 (`findFirst` 가 다중 매칭 시 조용히 첫 번째만 반환하는 silent corruption 경로 차단). 그 후 `prisma.quizOption.updateMany({ where: { questionId: result[0].id, order }, data: { text: newText } })` 로 option 을 교체한다 (Phase 1 step 1–4 의 unique 제약에 의해 `(questionId, order)` 가 안정 키로 동작).
   - 각 UPDATE 직후 영향 row 수 `=== 1` 을 assert. 0 이면 대상 미발견, 2+ 면 유일성 누락. 둘 중 하나라도 발생 시 `throw` 로 트랜잭션 rollback.
   - 전체 UPDATE 를 `prisma.$transaction` 으로 감싸 원자성 보장.
   - 스크립트 상단에 **expected-pass / expected-fail fixture 쌍 5~10개** 를 정의한다. 그 중 반드시 다음 4개를 포함:
     - `{ sentence: "I waited for an hour.", options: ["hour", "apple", "umbrella", "egg"], expect: "pass" }` — `hour` 음성 예외
     - `{ sentence: "She goes to a university.", options: ["university", "school", "store", "park"], expect: "pass" }` — `university` 음성 예외
     - `{ sentence: "I ate an ___ for breakfast.", options: ["apple", "banana", "grape", "orange"], expect: "fail" }` — 자음 시작 distractor 거부
     - `{ sentence: "She bought a ___.", options: ["apple", "book", "chair", "desk"], expect: "fail" }` — 모음 시작 distractor 거부
   - 실제 DB 업데이트 **직전에** 헬퍼를 이 fixture 로 self-test 한다. 기대와 다른 결과가 하나라도 나오면 즉시 중단 (헬퍼 자체의 버그 + whitelist 누락 방어).
   - self-test 통과 후 각 문항에 대해 규칙 2(관사)·규칙 3(가산성) 을 코드로 assert. 실패 시 즉시 중단.
8. `prisma/seed-quiz.ts` 를 동일 내용으로 동기 업데이트 (신규 빈 DB 초기 투입 대비)
9. **이중 진실원 diff 검증**: `fix-a1-a2-distractors.ts` 의 교체 목록과 `seed-quiz.ts` 의 수정본을 **문항 단위로 diff 대조**한다. PR 설명에 양쪽 파일의 변경 문항 수와 각 문항의 (questionId, order, old text, new text) 매트릭스를 붙여 리뷰어가 1대1 대응을 눈으로 확인 가능해야 한다. 자동화 옵션: `seed-quiz.ts` 의 해당 문항 배열을 `fix-a1-a2-distractors.ts` 와 동일한 데이터 모듈에서 import 하도록 리팩터링하면 장기적으로 drift 원천 차단 — 단, 본 RFC 범위에서는 diff 대조로 충분.
10. 개발 DB 에서 실행 후 `npx prisma studio` 로 결과 확인
11. **수동 검증 (두 샘플로 분리, 자동화 불가능한 규칙 커버)**:
    - **Sample A — 규칙 1 (의미 변별)**: 무작위 10문항을 한국어 힌트 없이 문장 + 보기만 보고 풀어 정답에 도달 가능한지 체감 검증.
    - **Sample B — 규칙 4·5 (난이도 상한 & 주제 형제)**: **별도** 무작위 10문항에 대해 distractor 4개가 모두 A1/A2 수준 어휘인지, 정답과 동일 카테고리의 형제 단어가 최대 1개 이하인지 수동 확인. 두 샘플은 서로 겹치지 않는다.
12. `npx tsc --noEmit` / `npm run lint` 통과
13. 커밋: `refactor : redesign A1/A2 quiz distractors for cloze discriminability`

### Phase 1 운영 DB 적용 단계 (PR 머지 후 수동 단계)

`package.json` 은 `prisma.seed` 필드를 **정의하지 않는다** (현재 `"prisma": "^7.3.0"` devDependency 버전만 있음). 기존 시드 (`prisma/seed-quiz.ts`) 와 마이그레이션 스크립트 (`prisma/add-context-hints.ts`) 모두 `npx tsx` 수동 실행 전용이다. 따라서 Phase 1 의 변경은 **실행 경로가 둘로 나뉜다**:

**자동 경로 (CI)**:

1. `@@unique([questionId, order])` migration (Phase 1 작업 순서 1-4 단계) 은 PR 머지 시 CI 배포 파이프라인의 `prisma migrate deploy` 가 자동 적용한다. 운영자 개입 불필요.

**수동 경로 (운영자)**:

2. `prisma/fix-a1-a2-distractors.ts` 는 `npx tsx` 수동 실행 전용이다. 운영 DB 에 적용하려면 운영자가 다음을 수행:
   - 운영 환경 컨텍스트에서 `DATABASE_URL` 을 운영 DB 로 설정 (로컬에서 직접 운영 DB 에 연결하는 경우 SSH 터널 · bastion host 등 팀 표준 경로 사용)
   - `npx tsx prisma/fix-a1-a2-distractors.ts` 실행
   - 스크립트는 자체 `prisma.$transaction` + `row count === 1` assert + throw-based rollback 을 포함하므로, 실패 시 DB 상태 무변화
   - 실행 로그 (stdout + stderr) 를 보존하여 PR 설명·운영 기록에 첨부
3. 적용 후 검증 (운영자):
   - Phase 1 에서 교체한 무작위 5문항을 `(englishWord, sentence)` 로 조회해 새 distractor (`order: 2 / 3 / 4` 의 `text`) 가 반영됐는지 `prisma studio` 또는 임의 쿼리로 확인
   - 교체 전 text 와 diff 가 PR 설명의 매트릭스와 일치하는지 확인
   - Phase 0-B 응답 셔플은 이미 운영에 있지만 DB 의 `order` 필드 자체는 변경되지 않았음을 확인 (응답 시점 셔플이므로 DB 는 그대로)

**시간 창 리스크**:

자동 경로 (1 단계) 와 수동 경로 (2 단계) 사이에는 운영 DB 가 "`@@unique([questionId, order])` 제약은 적용됐지만 distractor 는 교체 전" 상태가 된다. 이 창에서도:

- 진단 자체는 Phase 0-A 서버측 채점 + Phase 0-B 옵션 셔플이 이미 운영에 있기 때문에 정상 동작하며, 사용자 회귀는 없다.
- 다만 distractor 품질 개선이 지연되므로 Phase 2 를 이 창 안에서 머지하면 기존 저품질 distractor 환경에서 한국어 힌트가 제거되어 저-중 레벨 사용자의 체감 난이도가 과도하게 올라갈 수 있다 (RFC "문제 2 의 파급 효과" 섹션 참조).
- **따라서 Phase 1 PR 머지 직후 즉시 수동 실행을 스케줄** 한다. 창을 수 시간 이상으로 방치하지 않는다. 수동 실행 완료를 확인한 뒤에만 Phase 2 PR 머지 일정을 확정한다.

**로컬 / 운영 DB drift 방어**:

- 신규 개발자가 로컬 DB 를 `seed-quiz.ts` 로 초기화할 때 `fix-a1-a2-distractors.ts` 는 실행되지 않는다.
- 그러나 Phase 1 작업 순서 8 단계에서 `seed-quiz.ts` 의 A1/A2 101문항을 **동기 업데이트** 하므로, 머지 후 `seed-quiz.ts` 는 이미 새 distractor 상태이다. → 신규 로컬 DB 는 처음부터 교체 후 상태로 시작한다.
- 결과적으로: **로컬 = 처음부터 새 distractor**, **운영 = 수동 스크립트 실행 후 새 distractor**. 두 환경이 결국 수렴한다. drift 는 Phase 1 PR 머지 ~ 운영자 수동 실행 사이 시간 창에만 존재한다.
- Phase 1 작업 순서 9 단계의 "이중 진실원 diff 검증" (`seed-quiz.ts` ↔ `fix-a1-a2-distractors.ts` 매트릭스 대조) 이 이 drift 방어의 근간이므로, PR 리뷰어가 **문항 단위 대응** 을 눈으로 확인했음을 리뷰 코멘트에 남긴다.

**Follow-up 제안 (범위 밖)**:

- `package.json` 에 `prisma.seed` 필드를 도입해 `prisma db seed` 로 자동 실행 경로를 만드는 것은 본 RFC 범위 밖이다. 그러나 향후 유사한 수동 마이그레이션 스크립트가 반복될 가능성이 있으므로, Phase 1 완료 후 별도 인프라 태스크로 검토한다.
- 대안: `prisma/fix-a1-a2-distractors.ts` 를 `prisma/migrations/<timestamp>_fix_a1_a2_distractors/migration.sql` 형태의 raw SQL migration 으로 변환해 `prisma migrate deploy` 자동 경로에 편입하는 방안. 단 raw SQL 은 TypeScript assert · whitelist · self-test fixture 기반 방어 장치를 잃으므로 **본 RFC 에서는 tsx 스크립트를 고수**한다.

### Phase 2 작업 순서

1. `prisma/schema.prisma` 의 `LevelDiagnosis` 에 `scoringVersion Int @default(1)` 추가
2. `npx prisma migrate dev --name add_diagnosis_scoring_version`
3. **Prisma 클라이언트 전체 재생성 (필수)**: `rm -rf lib/generated/prisma && npx prisma generate`. `.claude/memory/MEMORY.md` 의 알려진 함정 — `lib/generated/prisma/models/` 내부 타입이 stale 로 남으면 다음 단계의 `scoringVersion` 주입 시 `Object literal may only specify known properties` TS 에러가 뜨고 원인 파악에 시간이 낭비된다. 이 단계를 생략하지 않는다.
4. `shared/constants/diagnosis.ts` 에 `export const CURRENT_SCORING_VERSION = 2;` 추가 (`DIAGNOSIS_TIME_LIMIT_SECONDS` 옆). `shared/constants/index.ts` 의 **기존** `export { DIAGNOSIS_TIME_LIMIT_SECONDS } from "./diagnosis";` 줄을 **in-place 갱신** 하여 `export { DIAGNOSIS_TIME_LIMIT_SECONDS, CURRENT_SCORING_VERSION } from "./diagnosis";` 로 만든다. 새 줄을 추가하지 말 것 — 같은 모듈에 대한 export 가 두 줄로 분리되면 lint 경고가 발생한다.
   - **FSD 근거**: `shared/lib/diagnosis-guards.ts` (같은 계층) 와 `app/api/diagnosis/submit/route.ts` (상위 계층) 둘 다 이 상수를 참조. `features/diagnosis/config/` 에 두면 `shared → features` 역참조가 되어 FSD 위반. 가장 낮은 공통 조상인 `shared/` 가 유일한 정답.
5. `app/api/diagnosis/submit/route.ts` 상단에 `import { CURRENT_SCORING_VERSION } from "@/shared/constants";` 추가 후 `prisma.levelDiagnosis.create` data 에 `scoringVersion: CURRENT_SCORING_VERSION` 추가
6. `shared/lib/diagnosis-guards.ts` 상단에 `import { CURRENT_SCORING_VERSION } from "@/shared/constants";` 추가
7. 같은 파일의 `checkDiagnosisStatus` 내 `prisma.levelDiagnosis.findFirst` select 에 `scoringVersion: true` **추가** (이 단계 누락 시 다음 단계가 기능하지 않는다)
8. 같은 파일의 `checkDiagnosisStatus` 반환 타입에 `needsRediagnosis: boolean` 추가. 계산 규칙: **`const needsRediagnosis = latestDiagnosis !== null && latestDiagnosis.scoringVersion < CURRENT_SCORING_VERSION;`** (명시적 null 체크 필수 — `hasCompleted && latestDiagnosis.scoringVersion < ...` 는 TS 가 `latestDiagnosis` 를 non-null 로 좁히지 않아 "Object is possibly 'null'" 컴파일 에러). 미완료 사용자(`latestDiagnosis === null`) 는 자동으로 `false` 가 되므로 별도 분기 불필요.
9. 같은 파일의 `preventDiagnosisRetake` 를 수정하여 `needsRediagnosis === true` 사용자의 쿨다운을 bypass
10. **`needsRediagnosis` 클라이언트 노출 (필수)** — 이 단계 누락 시 후속 재진단 배너 작업이 추가 plumbing 을 요구한다:
    - `app/api/diagnosis/status/route.ts` 의 `checkDiagnosisStatus` destructure 에 `needsRediagnosis` 를 추가하고 응답 JSON 에도 `needsRediagnosis` 필드를 그대로 포함한다.
    - `features/diagnosis/api/diagnosis-api.ts` 의 `DiagnosisStatusResponse` 인터페이스에 `needsRediagnosis: boolean` 필드를 추가한다. `useDiagnosisStatus` 훅은 `DiagnosisStatusResponse` 를 그대로 반환하므로 훅 자체 수정은 불필요.
11. `features/diagnosis/hooks/use-diagnosis-timer.ts` 의 시그니처를 `useDiagnosisTimer(initialSeconds, onExpire, paused: boolean = false)` 로 확장. 메인 `useEffect` 최상단에 `if (paused) return;` guard 를 추가하고 dependency 배열에 `paused` 를 포함한다. 기본값 `false` 로 인해 기존 호출부 (없다면 해당 없음) 도 호환.
    - **`onExpire` stale closure 방어 (필수)**: 현재 훅의 dependency 배열에 `onExpire` 가 없어 `handleSubmit` 이 `useCallback` 으로 안정화되어 있지 않을 경우 시간 초과 시 옛 closure 의 `answersById` 로 제출되는 silent 회귀가 발생할 수 있다. 본 Phase 2 작업에서 다음 **ref 패턴**으로 해결한다 (dependency 에 `onExpire` 를 추가하면 매 렌더 effect 재실행으로 `startTime` 이 재캡처되어 초기 의도인 "한 번 시작하면 끝까지 이어간다" 가 깨지므로 ref 경로가 유일한 안전 해법이다):
      ```typescript
      const onExpireRef = useRef(onExpire);
      useEffect(() => {
        onExpireRef.current = onExpire;
      }, [onExpire]);

      useEffect(() => {
        if (paused) return;
        // ... 기존 startTime = Date.now() 캡처 및 setInterval 로직
        // 만료 시점 호출을 onExpire() 대신 onExpireRef.current() 로 변경
      }, [initialSeconds, paused]);
      ```
    - **파일 상단에 Phase 2-B 의 JSDoc 블록 ("`paused` 는 pause/resume 이 아니라 시작 지연/리셋") 을 반드시 삽입**하여 후속 개발자의 "중간 일시정지" 기능 오용을 차단한다. 이 주석 없이는 `paused: false → true → false` 왕복마다 `initialSeconds` 가 재충전되는 시간 누수를 누가 도입해도 리뷰어가 못 잡는다. JSDoc 블록에 ref 패턴의 의도 ("`onExpire` 는 ref 로 latest 캡처, effect 는 재실행되지 않음") 도 함께 기록.
12. `features/diagnosis/ui/flow/diagnosis-question-card.tsx` 의 89–99줄 한국어 힌트 JSX 블록 제거
13. 배지 `mb-6` → `mb-10`, 문장 컨테이너 `p-6` → `p-8`, 문장 텍스트 `text-xl md:text-2xl` → `text-2xl md:text-3xl`
14. 신규 `features/diagnosis/ui/flow/diagnosis-intro-modal.tsx` 작성. 최상위 컨테이너는 반드시 `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4` 로 뷰포트 고정 오버레이 (Phase 2-B 참조). 인라인 블록 렌더 금지.
15. **`diagnosis-test.tsx` 리팩터** (서브스텝 순서대로). 현재 파일은 early-return 기반이고 RFC 초기 예시의 fragment 단일 return 은 **실제 구조와 맞지 않는다** (Phase 2-B "로딩/에러 분기와의 순서" 섹션 참조). 아래 7 서브스텝을 그대로 따른다:
    - **15-a (사전 재검증)**: `features/diagnosis/ui/flow/diagnosis-test.tsx` 를 다시 읽어 (a) `DiagnosisLoading` · `DiagnosisError` 가 `../status/diagnosis-loading` · `../status/diagnosis-error` 에서 **별도 컴포넌트로 import 되어 있는지**, (b) `DiagnosisError` 의 prop 이 `title` · `description` · `onRetry` 인지, (c) error 분기 조건이 `isError || questions.length === 0` 인지, (d) 완료 처리가 `useEffect` 내부 `router.push` side effect 인지 재확인. **현재 모두 참** — 그대로면 작업 불필요. 하나라도 어긋나면 Phase 2-B 섹션의 구조 설명을 업데이트하고 작업을 중단·재조정.
    - **15-b (state 추가)**: 기존 `useState` 선언부 뒤 (e.g. `isTransitioning` 선언 다음 줄) 에 `const [showIntroModal, setShowIntroModal] = useState(true);` 를 추가한다.
    - **15-c (타이머 3-인자)**: `useDiagnosisTimer(timeLimit, handleSubmit)` 호출을 `useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal)` 로 변경한다. 작업 순서 11 에서 훅 시그니처를 `paused: boolean = false` 로 확장했으므로 타입 호환됨.
    - **15-d (modal 변수 선언)**: `handleAnswer` / `navigateQuestion` 등 `useCallback` 선언 **뒤**, 첫 early return (`if (isLoading) ...`) **직전** 에 다음을 추가:
      ```tsx
      const introModal = showIntroModal ? (
        <DiagnosisIntroModal
          key="diagnosis-intro-modal"
          onStart={() => setShowIntroModal(false)}
        />
      ) : null;
      ```
      JSX 외부 선언이므로 `.claude/rules/code-style.md` 의 "JSX 내 ternary 금지" 규칙과 무관하다.
      - **`key="diagnosis-intro-modal"` 필수**: React 는 fragment 의 sibling 위치와 컴포넌트 타입이 같으면 reconcile 하지만, 본 패턴은 세 early return 분기의 자식 1 위치 타입이 매번 다르다 (`DiagnosisLoading` → `DiagnosisError` → `div`). 자식 1 이 unmount/mount 되는 경계에서 자식 0 의 `DiagnosisIntroModal` 까지 함께 unmount 되는 이론적 경계 케이스를 차단하려면 명시적 `key` 가 필수다. key 가 있으면 React 가 분기 전환 시에도 같은 instance 로 취급해 modal 내부 local state (입력 포커스·애니메이션 중간 상태) 가 보존된다. key 없이는 Phase 2-B "modal DOM 이 리마운트 없이 전이되는가" 회귀 체크가 reconciler 구현 디테일에 의존하게 된다.
    - **15-e (세 return 경로 fragment 감싸기)**: 세 return 각각을 fragment 로 감싸고 `{introModal}` 을 첫 element 로 삽입한다:
      - `if (isLoading) return <DiagnosisLoading />;` → `if (isLoading) return (<>{introModal}<DiagnosisLoading /></>);`
      - `if (isError || questions.length === 0) return (<DiagnosisError title=... description=... onRetry=... />);` → 같은 `DiagnosisError` 호출을 **그대로** fragment 내부에 배치하고 `{introModal}` 을 선행. **prop 이름·값 변경 금지** (`title` / `description` / `onRetry` 를 유지).
      - 메인 `return (<div className="min-h-screen ...">...</div>);` → fragment 로 감싸 `<>{introModal}<div className="min-h-screen ...">...</div></>` 형태. 기존 메인 JSX 내부 (배경 blob · `DiagnosisProgressBar` · `DiagnosisQuestionCard` · `DiagnosisNavigation`) 는 **한 글자도 수정하지 않는다**.
    - **15-f (`useEffect` 유지 — 변경 금지)**: 라인 39-43 의 `useEffect(() => { if (isSubmitSuccess && submitResult) router.push(...); }, [isSubmitSuccess, submitResult, router])` 는 **리팩터 대상 아님**. 완료 분기는 JSX 가 아니라 side effect 이며 modal 과 독립이다. 이 경로를 JSX 분기로 바꾸려 시도하지 말 것 — `router.push` 타이밍이 어긋나 완료 후에도 빈 화면이 남는 회귀 발생.
    - **15-g (회귀 체크)**: `npm run dev` 로 다음을 관찰:
      - 첫 진입 시 modal 이 로딩 스피너 위에 노출되고, 데이터 로드 완료 후 **같은 modal DOM 이 리마운트 없이** 메인 JSX 위로 전이된다.
      - 네트워크 오프라인으로 `isError` 트리거 → modal 이 `DiagnosisError` 카드 위에 떠 있다. 정책상 "에러 시 modal 숨김" 이 필요하면 15-d 의 선언을 `const introModal = showIntroModal && !(isError || questions.length === 0) ? (...) : null;` 로 가드한다. **기본값은 "modal 유지"**.
      - "시작하기" 클릭 → `showIntroModal = false` → `introModal = null` → layout shift 없음 (배경 blob 은 `fixed`, 본문은 `relative z-10` 이라 위치 보존).
      - 모든 답변 후 제출 → `useEffect` 의 `router.push` 트리거 → 결과 페이지로 네비게이션. modal 상태와 무관.
16. `npx tsc --noEmit` / `npm run lint` / `npm run build` 통과
17. `npm run dev` 로 진단 플로우 수동 확인:
    - 인트로 모달이 첫 진입 시 **뷰포트 전체에 오버레이로** 노출되고 "시작하기" 클릭 시 닫히는지
    - 모달이 열려 있는 동안 **타이머가 움직이지 않는지** (`DiagnosisProgressBar` 의 시간 표시가 고정됨을 확인). "시작하기" 클릭 직후 카운트다운 시작.
    - 모달이 `DiagnosisProgressBar` 앞에 공간을 차지해 본문이 아래로 밀리지 않는지 (layout shift 없음)
    - 카드 여백이 상단으로 쏠리지 않는지
    - A1/A2 문항이 의미 변별만으로 풀 수 있는지
    - 기존 `scoringVersion: 1` 이력이 있는 계정으로 홈 접근 → 쿨다운 bypass 로 재진단 가능한지
    - `scoringVersion: 2` 로 재진단 완료 후 30일 쿨다운이 다시 적용되는지
    - DB 에서 신규 진단 레코드의 `scoringVersion` 이 실제 `2` 로 저장됐는지 확인
    - `/api/diagnosis/status` 응답 JSON 에 `needsRediagnosis` 필드가 포함되고, 기존 `scoringVersion: 1` 계정에서 `true`, 재진단 완료 후 `false` 로 변화하는지 확인
18. 커밋: `refactor : remove korean hint from diagnosis and version scoring`

### Phase 3 작업 순서

1. Phase 2 배포 후 독립 사용자 최소 10명의 `scoringVersion >= CURRENT_SCORING_VERSION` 진단 데이터를 최대 4주 이내 수집
2. **조정 전 스냅샷 기록 (회귀 방지 기준선)**: 고정된 answer 시나리오 5~10개 (예: 완전 A1 사용자, A2 경계, B1 평균, B1 약점 편중, C1 상위) 를 `calculateDiagnosisScore` 에 입력해 `totalScore` / `cefrLevel` / `weaknessAreas` / `recommendedStartPoint` 결과를 `docs/specs/phase-3-calibration-snapshot.md` 의 "조정 전 (v2 초기)" 섹션에 기록한다. 이 시나리오 세트가 Phase 3 이후 회귀 방지 기준선이 된다.
3. `mapScoreToCEFR`, `analyzeWeaknesses` 60% 임계값, `getRecommendedLevel` ≥3 조건 세 지점을 수집 데이터에 근거해 조정한다. 한 번에 ±5 이내로 보수적 조정.
4. **조정 후 스냅샷 재기록**: 동일 시나리오 세트를 다시 돌려 `phase-3-calibration-snapshot.md` 에 "조정 후" 섹션을 추가한다. 전/후 diff 가 의도한 방향과 일치하는지 문서 내부에서 검증한다. 일치하지 않으면 조정을 되돌린다.
5. 완료 기준(체감 레벨 일치율 70%) 달성 시 커밋: `tune : recalibrate diagnosis CEFR thresholds and weakness logic`
6. Rollback 기준 도달 시 "완료·Rollback 기준" 섹션의 "Rollback 범위" 네 항목만 revert 한다. 유지 대상: **Phase 0 옵션 셔플** · Phase 1 distractor 개편 · `QuizOption` 의 `@@unique([questionId, order])` 제약 · `LevelDiagnosis.scoringVersion` 컬럼 · `shared/constants/diagnosis.ts` 의 `CURRENT_SCORING_VERSION` 상수 · `use-diagnosis-timer.ts` 의 `paused` 파라미터 시그니처. 재적용 시에는 "Rollback 범위 외" 섹션의 **재적용 프로토콜** (`CURRENT_SCORING_VERSION` 을 `3` 이상으로 상향) 을 따라 pocket record 를 격리한다.

**PR 분리 원칙**: Phase 0, Phase 1, Phase 2 는 반드시 **순차 PR 로 분리**한다. (1) Phase 0 옵션 셔플이 운영에 적용된 이후에만 Phase 1 distractor 개편이 의미를 가진다 (A만 누르기 exploit 가 차단되지 않으면 distractor 품질은 무의미). (2) Phase 1 migration 이 운영 DB 에 먼저 적용된 이후에만 Phase 2 UI 변경을 머지할 수 있다. 동일 PR 머지 금지. Phase 3 은 별도 PR.

## Expected Outcomes

### 정성적

- 진단 스코어가 사용자의 실제 어휘 recall 능력을 반영한다.
- 일반 퀴즈 Level 0 ≤ 진단 난이도 라는 자연스러운 위계가 성립한다.
- 사용자가 진단 후 배정받는 CEFR 레벨이 실제 학습 경로와 정합한다.
- 진단 UX 가 "translation matching" 에서 "contextual fill-in-the-blank" 으로 명확히 포지셔닝된다.
- **부가 이득 1**: Phase 0-A 의 서버측 정답 판정은 진단뿐 아니라 향후 퀴즈 submit 경로에도 "client 가 채점 결과를 주장하는" 안티패턴을 제거하는 템플릿 역할을 한다 (RFC 범위 밖 장기 효과).
- **부가 이득 2**: Phase 0-B 의 옵션 셔플은 진단뿐 아니라 일반 퀴즈 전체의 position bias 를 제거해 학습 효과를 전반적으로 개선한다 (RFC 범위 밖 효과).
- **부가 이득 3**: Phase 1 의 distractor 개편으로 퀴즈 Level 0 의 A1/A2 품질이 같이 개선된다 (RFC 범위 밖 효과).

### 정량적 (Phase 3 관찰 지표)

- 진단 평균 점수 분포 변화 (정규분포 근접 여부)
- CEFR 레벨별 분포 변화
- 진단 이탈률 변화 (상승 시 A1 문장의 단순화 별도 작업 신호)

## Risks & Mitigations

| 위험 | 완화책 |
|---|---|
| **[CRITICAL] Client-trust exploit**: `formatDiagnosisAnswers` 가 클라이언트 훅 (`use-diagnosis-quiz.ts:11`) 에서 호출되어 `option.isCorrect` 로 채점한 결과를 `DiagnosisAnswer.isCorrect: boolean` 으로 서버에 전송. 서버는 `diagnosisAnswerSchema` 의 `isCorrect: z.boolean()` 을 그대로 신뢰해 `calculateDiagnosisScore` 에 넘김. **DevTools Console 에서 `isCorrect: true` × 20 payload 를 제출하면 UI 를 보지 않고도 totalScore 100 / C2 배정**. Phase 0-B 셔플은 이 경로를 전혀 차단하지 못함 → Phase 3 재보정 표본 근본 오염. | **Phase 0-A** 로 정답 판정을 서버로 이전: `diagnosisAnswerSchema` 를 `{ questionId, difficulty, category, selectedText }` 로 재정의, `formatDiagnosisAnswers` 를 서버측 DB 재조회 기반으로 재작성, `/api/diagnosis/submit` 에서 `prisma.quizQuestion.findMany({ where: { id: { in: questionIds } }, include: { options: true } })` 후 서버측 채점. `QuestionOption.isCorrect` 필드를 API 경계 타입에서 제거해 응답 payload 에서 완전 삭제. Phase 0-A + Phase 0-B 를 **단일 PR 원자 머지**. |
| **Pre-existing position bias**: 시드 200문항 전부에서 정답이 `order: 1` 고정이고 UI·API 경로 어디에도 옵션 셔플이 없어 (Phase 0-A 차단 후 남는) 위치 암기 경로로 여전히 cheating 가능. 방치 시 Phase 1 distractor 품질·Phase 2 한국어 힌트 제거·Phase 3 재보정 표본이 모두 공염불. | **Phase 0-B** 로 `features/diagnosis/lib/question-generator.ts` 와 `app/api/quiz/daily/route.ts` 의 응답 경로에 `shuffleArray(options).map(...)` 를 적용해 응답 시점 셔플. DB 비파괴라 Phase 1 의 `(questionId, order)` 안정 키 UPDATE 전략과 충돌 없음. |
| **`shuffleArray` 반환값 폐기 no-op 함정**: `shared/lib/shuffle-array.ts` 의 `shuffleArray` 는 Fisher-Yates immutable 구현으로 **새 배열을 반환**하고 원본을 변형하지 않음. `shuffleArray(q.options); q.options.map(...)` 형태로 쓰면 반환값이 버려져 셔플 미적용. 컴파일·lint·타입 체크 모두 통과하므로 수동 검증에서만 발견. | Phase 0 작업 순서 11·12 단계에 **`options: shuffleArray(q.options).map(...)` 체이닝 형태**를 pseudocode 로 명시. 수동 검증에 "정답 선택지가 회마다 A/B/C/D 중 다른 위치 에 가는지" 명시 (문항 순서 셔플과 혼동 금지). |
| **Phase 0-A 으로 `option.text` 가 아닌 배열 인덱스·`order` 기반 정답 판정 경로가 있으면 회귀** | Phase 0 작업 순서 1 단계에서 `format-answers.ts` · `quiz-question.tsx` · `quiz-detail-results.tsx` 의 `isCorrect` 사용처를 grep 으로 사전 재확인. `format-answers.ts:11` 은 `option.text` 기반 (안전). `quiz-question.tsx:170` 은 `selectedAnswer === option.text` (안전). `quiz-detail-results.tsx:54/86` 의 `item.isCorrect` 는 `/api/quiz/submit` 응답 필드 (GET 응답과 무관, 안전). 예상외 의존이 발견되면 Phase 0-A 범위에서 함께 수정. |
| **`needsRediagnosis` TS 타입 좁힘 실패**: `checkDiagnosisStatus` 반환 타입은 `hasCompleted: boolean` 과 `latestDiagnosis: ... | null` 을 별개 필드로 선언. `hasCompleted && latestDiagnosis.scoringVersion < CURRENT_SCORING_VERSION` 형태로 쓰면 TS 가 `hasCompleted` truthiness 로 `latestDiagnosis` 를 non-null 로 좁히지 않아 "Object is possibly 'null'" 컴파일 에러. Phase 2 전체가 컴파일 단계에서 막힘. | Phase 2-C 설계·작업 순서 8 에 **`const needsRediagnosis = latestDiagnosis !== null && latestDiagnosis.scoringVersion < CURRENT_SCORING_VERSION;`** 명시적 null 체크 형태로 고정. 미완료 사용자 (`latestDiagnosis === null`) 는 자동으로 `false` 가 되므로 별도 분기 불필요. |
| **`"use server"` 모듈에 type export 추가 시 빌드 파괴**: `shared/lib/diagnosis-guards.ts:1` 은 `"use server"` 디렉티브 시작. Next.js 규약상 모든 named export 가 async function 이어야 함. "반환 타입에 `needsRediagnosis` 추가" 지시를 잘못 해석해 같은 파일에서 `export interface DiagnosisStatusResult` 를 추가하면 Server Actions 제약으로 빌드 즉시 파괴. `shared/lib/index.ts` 배럴에 재수출해도 client 빌드 파괴 (`.claude/memory/MEMORY.md`). | Phase 2-C 상단에 **"`"use server"` 제약 사전 경고"** 블록을 추가: 타입은 inferred return type 으로만 확장하고 별도 `export interface` 금지, 필요 시 `entities/diagnosis/types.ts` 등 다른 파일에 분리. `shared/lib/index.ts` 배럴 재수출 금지. |
| Phase 1 distractor 교체 중 정답 문맥이 꼬여 난이도가 과도해짐 | 교체 후 각 문항을 수동 풀이로 검증. `englishWord` 와 `koreanHint` 는 보존. |
| Phase 1 에서 일부 문항 누락 (감사 실수) | 배포 후 사용자 피드백 수집. 발견 시 후속 migration 스크립트로 보정. |
| **Phase 1 distractor 교체가 관사(`a`/`an`)·가산성 문법 단서를 만들어 어휘가 아닌 문법으로 정답이 결정됨** | 교체 규칙 2(관사 일치) · 3(가산성 일치) 을 모든 문항에 적용. `fix-a1-a2-distractors.ts` 실행 전에 규칙 2·3 을 코드 assert 로 강제 검증. 위반 시 스크립트 중단. |
| **관사 assert 가 철자 기반 `/^[aeiou]/` 정규식만 쓰면 음성 예외를 못 잡음** (`hour`/`honest` = an 필요, `university`/`useful` = a 필요 — 이 단어들이 distractor 후보에 섞이면 스크립트가 오탐/누락) | `startsWithVowelSound` 헬퍼에 음성 예외 whitelist 하드코딩 (Phase 1 구현 형태). self-test fixture 에 `hour`/`university` 케이스 필수 포함 (Phase 1 작업 순서 7). whitelist 누락 시 self-test 가 실패해 스크립트 중단. |
| **`QuizOption` 에 `(questionId, order)` unique 제약이 없어 "안정 키" UPDATE 가 DB 레벨에서 보장되지 않음**. 동일 (questionId, order) 중복 행이 존재할 경우 `updateMany` 가 조용히 둘 다 수정하거나 0건 반환해도 에러 없이 통과 → silent data corruption | Phase 1 step 1–4 에서 **선행 migration** 으로 `@@unique([questionId, order])` 추가. 기존 중복 시 migration 실패로 즉시 발견. 추가로 스크립트 내에서 각 UPDATE 의 영향 row 수 `=== 1` 을 명시 assert, 위반 시 트랜잭션 rollback. |
| **`seed-quiz.ts` 재시드 경로로 Phase 1 을 적용해 `QuizOption` 레코드가 삭제·재삽입 → 과거 `UserQuizAttempt.selectedAnswer` 텍스트가 현재 options 와 조용히 어긋남** (현재 스키마에서 `selectedAnswer` 는 `String` 이므로 FK 연쇄 파괴는 없지만, 텍스트 박제값이 현재 options 에 존재하지 않는 상태가 되어 향후 "오답 복습" 류 기능이 붙으면 silent misalignment 발생) | 재시드 경로 금지. `fix-a1-a2-distractors.ts` 는 `(questionId, order)` 안정 키로 `QuizOption` UPDATE 만 사용하며 단일 트랜잭션으로 감싼다. `QuizOption.id` 가 보존되어 향후 join 경로가 추가되어도 안전. 운영 DB 작업 전 백업 필수. |
| **`QuizQuestion.id` 는 `cuid()` 라 dev DB 와 prod DB 에서 다른 값을 가짐 → 스크립트에 questionId 를 하드코딩하면 prod 에서 0 건 매칭 또는 잘못된 문항 수정 발생** | 스크립트에 questionId 하드코딩 금지. 대신 **콘텐츠 키 `(englishWord, sentence)` → `findMany` + `length === 1` assert → `(questionId, order)` UPDATE** 의 2-step lookup 을 강제. 교체 목록 데이터 형태는 `{ englishWord, sentence, replacements: [{ order, newText }] }` 이며 questionId 필드는 절대 등장하지 않음. |
| **`(englishWord, sentence)` 콘텐츠 키 다중 매칭 시 silent corruption**: `QuizQuestion` 모델에 `(englishWord, sentence)` 유일성 DB 제약 없음. `findFirst` / `findFirstOrThrow` 는 다중 매칭 시 조용히 첫 번째 행만 반환 → 수동 INSERT 등으로 중복이 존재하면 스크립트가 잘못된 문항을 수정해도 에러 없이 통과. Phase 1 의 옵션 측 `@@unique([questionId, order])` 와 비대칭 방어. | Phase 1 구현 형태 단계에서 **`findMany` + `result.length === 1` 명시 assert** 를 강제. 0 → 미매칭 throw, 2+ → 유일성 붕괴 throw, 둘 다 트랜잭션 rollback. `findFirst` / `findFirstOrThrow` 사용 금지. QuizQuestion 측 `@@unique` migration 은 follow-up RFC 범위. |
| **`fix-a1-a2-distractors.ts` 와 `seed-quiz.ts` 이중 진실원 → 수동 동기화 누락 시 운영 DB 와 신규 개발자 로컬 DB 가 divergence** | Phase 1 작업 순서 9 단계에 **문항 단위 diff 대조** 체크를 명시. PR 설명에 양쪽 파일의 (questionId, order, old text, new text) 매트릭스 첨부 필수. |
| **저장 경로에서 `scoringVersion: 2` 가 누락되어 신규 진단이 `scoringVersion: 1` 로 저장 → Phase 3 표본 오염** | 단일 상수 `CURRENT_SCORING_VERSION` (Phase 2-C) 을 저장 경로와 bypass 판정이 공유하여 드리프트 원천 차단. 버전은 schema default 에 의존하지 않고 소스 코드에서 명시 주입. Phase 2 수동 확인 단계 (작업 순서 17) 에 "DB 에서 신규 진단 레코드의 `scoringVersion` = 2 확인" 항목 포함. |
| **`CURRENT_SCORING_VERSION` 을 `features/diagnosis/config/` 에 두면 `shared/lib/diagnosis-guards.ts` 가 `features` 를 역참조해 FSD 계층 규칙 위반** (`.claude/rules/architecture.md` unidirectional flow) | 상수를 기존 `shared/constants/diagnosis.ts` 에 둔다. `shared/lib/` 는 동일 계층 참조, `app/api/` 와 `features/diagnosis/` 는 상위 → 하위 참조로 모두 FSD 준수. `features/diagnosis/config/` 는 필요 시 재수출만 허용. |
| **`DiagnosisIntroModal` 이 표시되는 동안 `useDiagnosisTimer` 가 즉시 카운트다운 시작 → 사용자가 모달 읽는 동안 제한시간 누수 → rollback 트리거 "진단 이탈률 30% 증가" 가 난이도 문제가 아닌 타이머 누수만으로 발화해 rollback 근거 오염** | `use-diagnosis-timer.ts` 를 `(initialSeconds, onExpire, paused)` 로 확장하여 `paused === true` 동안 `setInterval` 시작 자체를 스킵. `diagnosis-test.tsx` 에서 `useDiagnosisTimer(timeLimit, handleSubmit, showIntroModal)` 로 호출. Phase 2 수동 확인에 "모달 열린 동안 타이머 고정" 항목 포함. |
| **`DiagnosisIntroModal` 을 인라인 블록으로 렌더하면 `DiagnosisProgressBar` 앞에 공간을 차지해 §2-A 여백 보정이 무효화되는 layout shift 발생** | 최상위 컨테이너를 반드시 `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm` 오버레이로 구현. RFC 2-B "CSS 전략 (필수)" 섹션에 명시. Phase 2 수동 확인에 "layout shift 없음" 항목 포함. |
| **`DiagnosisIntroModal` 을 early-return 로딩/에러 분기 뒤에 두면 FOUC 발생**: questions fetch 중에는 모달이 안 보이다가 fetch 완료 후 카드가 잠깐 번쩍이고 모달이 덮는 시각 회귀. | Phase 2-B "로딩/에러 분기와의 순서 (필수)" 섹션 + 작업 순서 15 에 **"반환 JSX 의 최상위 fragment 첫 element 로 모달을 두고 그 뒤에 loading/error/complete 분기 JSX 를 이어 붙인다"** 규칙 명시. 모달이 `fixed inset-0` 오버레이라 본문 플로우와 독립적이므로 로딩 스피너 위에 떠 있어도 문제 없음. 타이머는 `paused: showIntroModal` 로 막혀 있어 시간 누수 없음. |
| **`useDiagnosisTimer.paused` 시맨틱 오용**: `paused` 는 "pause/resume" 이 아니라 "시작 지연/리셋" 이다. `paused: false → true → false` 왕복마다 `initialSeconds` 가 재충전되어 후속 "중간 일시정지" 기능이 추가될 경우 시간 누수가 조용히 발생. | Phase 2-B 훅 확장 설계·작업 순서 11 에서 **JSDoc 블록을 `use-diagnosis-timer.ts` 상단에 필수 삽입**. 주석 내용: `paused: true → false` 전환 시 `startTime = Date.now()` 재캡처로 처음부터 재시작된다는 사실, 왕복 사용 금지, 중간 일시정지가 필요하면 "경과 시간 보존" 버전으로 재설계 필요. 현재 사용처는 `DiagnosisIntroModal` 1회성 진입뿐이라 안전하지만 후속 개발자의 오용을 주석이 차단. |
| **Prisma schema 변경 후 `lib/generated/prisma/models/` 의 stale 타입이 남아 `scoringVersion` 주입 시 `Object literal may only specify known properties` TS 에러** (`.claude/memory/MEMORY.md` 의 알려진 함정) | Phase 2 작업 순서 3 단계에 `rm -rf lib/generated/prisma && npx prisma generate` 명시. `npx prisma migrate dev` 직후 항상 수행. |
| **Phase 2 rollback 시 이미 저장된 `scoringVersion: 2` 레코드들이 DB 에 남아 있고, 재시도 시 `CURRENT_SCORING_VERSION` 을 `2` 그대로 두면 Phase 3 필터가 이 "pocket" 레코드를 재보정 표본에 포함시켜 오염** | 재적용 시 `CURRENT_SCORING_VERSION` 을 `3` 이상으로 상향 (Rollback 섹션의 "재적용 프로토콜"). scoringVersion 컬럼과 과거 레코드는 비파괴적으로 보존하되 필터로 격리. |
| Phase 0/1 건너뛰고 Phase 2 만 단독 배포되는 사고 | Phase 0, Phase 1, Phase 2 를 **순차 PR 로 분리**. Phase 0 옵션 셔플 머지 → Phase 1 migration 머지 → Phase 2 UI 머지 순으로만 진행. PR 템플릿 체크리스트에 "Phase 0 셔플 적용 여부" / "Phase 1 migration 적용 여부" 두 항목을 모두 명시. |
| **기존 사용자의 옛 점수(힌트 있음)와 신규 점수(힌트 없음)가 같은 임계값으로 해석되어 두 모집단 이질화** | `LevelDiagnosis.scoringVersion` 필드 도입 (Phase 2). Phase 3 재보정은 `scoringVersion >= 2` 표본에만 적용. 기존 `scoringVersion: 1` 레코드는 옛 기준으로 의미 보존. |
| **30일 쿨다운으로 최근 진단 사용자가 재진단 불가 → 부풀려진 레벨에 장기 고착** | `preventDiagnosisRetake` 를 `scoringVersion < 2` 사용자에게는 bypass 하여 즉시 재진단 허용. 강제는 아니며 사용자 선택. |
| **`needsRediagnosis` 가 `checkDiagnosisStatus` 내부에만 존재하고 `app/api/diagnosis/status/route.ts` 응답·`DiagnosisStatusResponse` 클라이언트 타입까지 전달되지 않음 → 후속 "재진단 가능 배너" 작업이 라우트 응답·타입·쿼리 키 무효화 plumbing 을 추가 작업으로 더 해야만 시작 가능 → 본 RFC 의 "API 만 준비" 약속 미완** | Phase 2 작업 순서 10 단계에서 `app/api/diagnosis/status/route.ts` 응답 JSON 과 `features/diagnosis/api/diagnosis-api.ts` 의 `DiagnosisStatusResponse` 에 `needsRediagnosis` 필드를 함께 추가한다. 수동 검증 단계에 "`/api/diagnosis/status` 응답에 `needsRediagnosis` 포함, scoringVersion 1→2 전환 시 true→false 변화 확인" 항목 포함. |
| **힌트 제거로 category 정확도가 일괄 하락 → `analyzeWeaknesses` 60% / `getRecommendedLevel` ≥3 이 대부분 사용자에 적중 → CEFR 연쇄 하향** | Phase 3 재검토 대상에 두 조건 모두 포함. 필요 시 60% → 50~55%, ≥3 → ≥4 로 조정. |
| Phase 3 표본 부족으로 임계값 조정이 오버핏 | 독립 사용자 최소 10명, 1인 1회로 제한. 표본 미달 시 기한 연장. 한 번에 ±5 이내 보수적 조정. |
| **Phase 3 무기한 지연으로 왜곡된 임계값 장기 운용** | Phase 2 배포 후 최대 4주 완료 기한 명시. 기한 도과 시 Phase 2 rollback 검토. Rollback 시 Phase 1 은 유지. |
| 사용자가 "힌트가 사라졌다"는 부정적 피드백 | 진단 시작 페이지(`diagnosis-test.tsx`)에 안내 문구 추가 (Phase 2-B). |
| **여백 보정 부족으로 카드가 상단 쏠림** | 배지 `mb-6` → `mb-10`, 문장 컨테이너 `p-6` → `p-8`, 텍스트 크기 상향의 3점 보정을 병행. 배포 전 브라우저 수동 확인. |
| **`diagnosis-test.tsx` 의 early-return 구조가 RFC 초기 fragment 예시와 괴리**: RFC 초안은 `{isLoading && <DiagnosisLoading />} {error && <DiagnosisError error={error} />} {questions && <DiagnosisQuestionCard ... />}` 형태의 단일 fragment return 을 전제했으나 실제 파일은 (a) `DiagnosisError` 가 `error` prop 이 아닌 `title` / `description` / `onRetry` 를 받고, (b) error 조건이 `isError \|\| questions.length === 0` 복합 조건이며, (c) 완료 분기가 `useEffect` + `router.push` side effect 이고, (d) derived 값 (`currentQuestion` 등) 이 early return **뒤** 에 선언되어 있다. 단순 "모달을 fragment 첫 element 로" 지침만 따르면 prop 오류 · 복합 조건 누락 · 완료 타이밍 회귀가 발생한다. | Phase 2-B "로딩/에러 분기와의 순서 (필수)" 섹션을 **실측 파일 구조 + "modal 변수 재사용" 패턴**으로 재작성. Phase 2 작업 순서 15 를 **7 서브스텝 (15-a ~ 15-g)** 으로 분리: (a) 사전 파일 재검증, (b) `showIntroModal` state 추가, (c) 타이머 3-인자 전환, (d) `const introModal = showIntroModal ? (...) : null` 선언, (e) 세 return 경로를 fragment 로 감싸고 `{introModal}` 선행, (f) `useEffect(isSubmitSuccess → router.push)` 변경 금지, (g) 첫 진입 / error / modal 닫기 / 완료 4가지 회귀 체크. |
| **Phase 1 의 `prisma/fix-a1-a2-distractors.ts` 가 수동 실행 전용이고 `package.json` 에 `prisma.seed` 필드가 없어 운영 DB 적용 프로세스가 미정의**: PR 머지만으로는 `@@unique([questionId, order])` migration 만 CI `prisma migrate deploy` 로 자동 적용되고 distractor 교체는 적용되지 않는다. 운영자 수동 개입 스케줄이 부재하면 운영 DB 가 "제약 적용 완료 / distractor 교체 전" 상태로 방치되어 Phase 2 이후 Phase 3 재보정 표본이 저품질 distractor 환경에서 수집된다. | Phase 1 에 **"운영 DB 적용 단계" 서브섹션** 추가: 자동 경로 (CI `prisma migrate deploy`) 와 수동 경로 (운영자 `npx tsx`) 를 분리 명시하고 (a) 실행 명령, (b) 적용 후 검증 쿼리, (c) 실패 시 transaction rollback, (d) 로그 보존을 지정. **Phase 1 PR 머지 직후 즉시 수동 실행을 스케줄** 하고 수동 실행 완료 확인 후에만 Phase 2 PR 머지 일정 확정. 로컬/운영 drift 는 작업 순서 8 (seed-quiz.ts 동기 업데이트) + 9 (diff 매트릭스 대조) 로 수렴 보장. Follow-up 으로 `prisma.seed` 필드 도입 또는 raw SQL migration 전환 검토 (RFC 범위 밖). |
| **[HIGH] Phase 0-A 의 `selectedText: z.string().min(1)` 과 빈 문자열 fallback 충돌 (시간 초과 자동 제출 회귀)**: 초안은 스키마에 `.min(1)` 을 강제하면서 클라이언트 payload 구성을 `selectedText: answersById[q.id] ?? ""` 로 두어, 사용자가 일부 문항을 답하지 않은 상태에서 `useDiagnosisTimer` 만료로 자동 제출되면 빈 문자열이 `.min(1)` 위반으로 400 처리되어 **진단 결과 발급이 실패**. 현재(Phase 0-A 이전) 동작은 `format-answers.ts:11` 이 미답변을 `isCorrect: false` 로 자연 처리하지만, 초안대로면 회귀. Phase 3 rollback 트리거 ("진단 이탈률 30% 증가") 가 기능 품질이 아닌 zod validation 회귀 때문에 발화. | Phase 0-A 스키마를 `selectedText: z.string()` 로 완화 (빈 문자열 허용) 하고, 서버측 `formatDiagnosisAnswers` 가 `correctOption?.text === submitted.selectedText` 매칭 실패를 자연히 `isCorrect: false` 로 처리하도록 본문 의사코드 명시. 클라이언트의 `answersById[q.id] ?? ""` fallback 은 의도적으로 유지. Phase 0-A 검증 단계 (e) 에 "시간 초과 자동 제출 정상 경로" 를 필수 회귀 체크로 명시. |
| **[MEDIUM] Phase 0-A 의 `difficulty` / `category` 클라이언트 신뢰 경로 (가중치 조작 우회 exploit)**: 초안은 `diagnosisAnswerSchema` 에 `difficulty` · `category` 를 유지했으며 `formatDiagnosisAnswers` 서버 재배치의 본문 구현을 명시하지 않았다. 구현자가 `submitted.difficulty` 를 그대로 출력에 사용하면 exploit 시도자가 모든 답변을 `difficulty: "C1"` 로 조작해 `DIFFICULTY_WEIGHTS.C1` 가중치를 부풀리는 우회 경로가 남는다. Phase 0-A 가 "client-trust exploit 를 제거했다" 고 주장하면서도 가중치 채널이 열린 채로 머문다. | Phase 0-A 스키마에서 **`difficulty` 와 `category` 를 완전히 제거**하고 와이어 타입 `DiagnosisSubmitAnswer` 를 `{ questionId, selectedText }` 로 축소. 서버측 `formatDiagnosisAnswers` 본문을 **의사코드로 명시** 하여 `dbQuestion.difficulty` / `dbQuestion.category` 만 사용하고 `submitted.difficulty` / `submitted.category` 는 읽지 않는다는 불변 조건을 강제. Phase 0-A 검증 단계 (d) 에 "`grep -rn "submitted\.difficulty"` 가 서버 파일에서 0건" 을 회귀 체크로 명시. |
| **[MEDIUM] Phase 0-A 의 중복 questionId 제출 (가중치 ×N 누적 exploit)**: 초안 스키마는 answer 배열에 유일성 검증이 없어, exploit 시도자가 C1 문항의 정답 텍스트 하나만 UI 로 관찰한 뒤 같은 questionId × 20 payload 를 조작해 동일 가중치를 20번 누적시키는 경로가 열린다. 서버가 `findMany` 로 1건만 반환해도 구현자가 `submitAnswers` 루프로 출력하면 exploit 성립. | Phase 0-A 스키마에 `.refine((arr) => new Set(arr.map((a) => a.questionId)).size === arr.length, "Duplicate questionId")` 를 추가. 동일 PR 에서 `/api/diagnosis/submit` 에 `dbQuestions.length !== submitAnswers.length` 400 가드를 추가해 zod 가 막지 못하는 "존재하지 않는 questionId" 까지 함께 차단. Phase 0-A 검증 단계 (b)(g) 로 확인. |
| **[MEDIUM] Phase 0-A 의 답변 수 검증 누락 (소수 답변으로 100% 달성 exploit)**: 초안 스키마는 `answers: z.array(...).min(1)` 만 요구해, 클라이언트가 C1 문항 1개만 정답으로 포함해 제출하면 `scoring.ts:7-17` 의 `maxPossibleScore` 분모가 단 하나의 가중치가 되어 `totalScore = 100 / C2` 배정이 성립한다. | `features/diagnosis/config/index.ts` 에 `TOTAL_DIAGNOSIS_QUESTION_COUNT = QUESTION_DISTRIBUTION.reduce(...)` 를 추가해 단일 출처를 만들고, Phase 0-A 스키마에서 `answers.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` 로 강제. 장래 분포 변경 시 상수만 갱신하면 스키마가 자동 동기화. Phase 0-A 검증 단계 (c) 로 확인. |
| **[LOW] Phase 2 의 `introModal` fragment 리마운트 경계**: modal 변수 재사용 패턴은 세 early return 분기의 자식 1 위치 타입이 매번 다르다 (`DiagnosisLoading` → `DiagnosisError` → `div`). 자식 1 이 unmount/mount 되는 경계에서 자식 0 의 `DiagnosisIntroModal` 까지 함께 unmount 되는 이론적 경계 케이스가 있다. reconciler 구현 디테일에 의존한 "modal DOM 이 리마운트되지 않음" 가정이 modal 내부 local state (입력 포커스·애니메이션) 튐을 유발할 수 있다. | Phase 2 작업 순서 15-d 의 `introModal` 선언에 **`key="diagnosis-intro-modal"` 을 명시 부여**. 명시 key 는 React 의 분기 전환 reconciliation 이 같은 instance 로 취급하도록 강제해 local state 가 보존된다. Phase 2-B Proposed Changes 예시 코드에도 동일하게 반영. |
| **[LOW] Phase 2 의 `useDiagnosisTimer` `onExpire` stale closure**: 초안은 `paused` 인자만 추가하고 dependency 배열은 `[initialSeconds, paused]` 로 두어 `onExpire` 가 누락된 채였다. `handleSubmit` 이 `useCallback` 으로 안정화되어 있지 않으면 타이머가 시작된 후 `answersById` 가 바뀌어도 stale closure 의 빈 `answersById` 로 제출되는 silent 회귀. 반대로 `onExpire` 를 dependency 에 넣으면 매 렌더 effect 재실행으로 `startTime = Date.now()` 가 재캡처되어 타이머가 영원히 리셋. | `onExpireRef = useRef(onExpire)` + 별도 effect 로 ref 를 최신 값에 동기화하고, 메인 effect 는 `[initialSeconds, paused]` dependency 만 유지하되 만료 시점에서 `onExpireRef.current()` 를 호출. "타이머 구간 불변, 콜백만 최신" 패턴이 양쪽 회귀를 동시 차단. Phase 2-B JSDoc 블록과 Phase 2 작업 순서 11 에 반드시 포함. |

## References

### Internal

- 아키텍처: `docs/architecture/fsd-architecture-guidelines.md`
- UI 구조: `docs/architecture/ui-structure-guidelines.md`
- 코드 스타일: `docs/conventions/code-style.md`
- 파일 명명: `docs/conventions/file-naming.md`
- 관련 파일:
  - `features/diagnosis/ui/flow/diagnosis-question-card.tsx` (Phase 2 한국어 힌트 JSX 제거)
  - `features/diagnosis/ui/flow/diagnosis-test.tsx` (Phase 2 모달 주입 · 모달은 fragment 최상위 first element 로 · `key="diagnosis-intro-modal"` 필수)
  - `features/diagnosis/hooks/use-diagnosis-timer.ts` (Phase 2 `paused` 파라미터 도입 + `onExpireRef` 패턴 + JSDoc 필수)
  - `features/diagnosis/hooks/use-diagnosis-quiz.ts` (Phase 0-A client 측 `formatDiagnosisAnswers` 호출 제거 · payload 를 `{ questionId, selectedText }` 로 축소)
  - `features/diagnosis/lib/scoring.ts` (Phase 3 임계값 조정)
  - `features/diagnosis/lib/question-generator.ts` (Phase 0-A `isCorrect` 제거 · Phase 0-B `shuffleArray(options).map(...)` 적용 지점)
  - `features/diagnosis/lib/format-answers.ts` (Phase 0-A 서버측 재배치 · DB 재조회 기반 채점 · `difficulty`/`category` 도 DB 값만 사용)
  - `features/diagnosis/lib/index.ts` (Phase 0-A `formatDiagnosisAnswers` barrel export 제거)
  - `features/diagnosis/api/diagnosis-api.ts` (Phase 2 `DiagnosisStatusResponse.needsRediagnosis` 추가)
  - `shared/constants/diagnosis.ts`, `shared/constants/index.ts` (Phase 0-A `TOTAL_DIAGNOSIS_QUESTION_COUNT` 상수 추가 — 스키마 `.length(...)` 단일 출처, `entities` → `features` FSD 역참조 방지)
  - `features/diagnosis/config/index.ts` (Phase 0-A `TOTAL_DIAGNOSIS_QUESTION_COUNT` drift 런타임 assert 추가)
  - `features/quiz/ui/game/quiz-question.tsx` (Phase 0-A `option.isCorrect` 미의존 재확인 — `selectedAnswer === option.text` 기반)
  - `features/quiz/ui/result/quiz-detail-results.tsx` (Phase 0-A 재확인 — `item.isCorrect` 는 `/api/quiz/submit` 응답 필드이지 GET 응답과 무관)
  - `entities/question/types.ts` (Phase 0-A `QuestionOption.isCorrect` 제거 · `DiagnosisSubmitAnswer = { questionId, selectedText }` 타입 추가)
  - `entities/question/lib/schemas.ts` (Phase 0-A `diagnosisAnswerSchema` 를 `{ questionId, selectedText }` 로 축소 + `.length(TOTAL_DIAGNOSIS_QUESTION_COUNT)` + 중복 questionId `.refine`)
  - `shared/lib/shuffle-array.ts` (Phase 0-B 재사용 유틸 · Fisher-Yates immutable)
  - `shared/lib/diagnosis-guards.ts` (Phase 2 `scoringVersion` select · `needsRediagnosis` 계산 · **`"use server"` 제약 준수**)
  - `shared/constants/diagnosis.ts`, `shared/constants/index.ts` (Phase 2 `CURRENT_SCORING_VERSION` 상수)
  - `app/api/quiz/daily/route.ts` (Phase 0-A `isCorrect` 제거 · Phase 0-B `shuffleArray(options).map(...)` 적용 지점)
  - `app/api/diagnosis/submit/route.ts` (Phase 0-A DB 재조회 + 서버측 채점 · Phase 2 `scoringVersion` 주입)
  - `app/api/diagnosis/status/route.ts` (Phase 2 `needsRediagnosis` 응답 노출)
  - `prisma/schema.prisma` (Phase 1 `QuizOption` unique · Phase 2 `LevelDiagnosis.scoringVersion`)
  - `prisma/seed-quiz.ts` (Phase 1 대상)

### External

- CEFR 표준 배치 테스트 형식 (Cambridge English Placement Test, Oxford Online Placement Test)
