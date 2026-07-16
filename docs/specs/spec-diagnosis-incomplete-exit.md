---
doc_type: spec
status: implemented
owner: "@hamsangeok"
last_updated: 2026-07-12
target_release: "TBD"
links:
  - issue: "TBD"
    ai_component: none
---

# 진단 중도 이탈 시 A1 레벨 할당 버그 수정

## 구현 상태 (2026-07-09 코드 검증)

구현 완료 — `features/diagnosis/ui/flow/diagnosis-test.tsx`의 타이머 만료 핸들러가
`MIN_DIAGNOSIS_ANSWERS` 미만이면 자동 제출 대신 `DiagnosisExpired` 재시도 화면을 띄운다.
중도 이탈(새로고침·이탈) 경로는 `useUnsavedDiagnosisWarning`으로 경고 처리.

## Overview

사용자가 레벨 진단을 중간에 중단하고 페이지를 이탈하면, 실제 진단을 완료하지 않았음에도 CEFR 레벨이 A1로 표시되는 버그를 수정한다. 두 가지 독립적인 원인이 존재하며, 각각에 대한 수정을 제안한다.

## Current State

### 원인 1: 타이머 만료 시 미답변 문항을 빈 문자열로 자동 제출

사용자가 진단 페이지를 열어둔 채 다른 탭으로 이동하면, React 컴포넌트가 마운트된 상태로 유지되어 5분(300초) 타이머가 계속 실행된다. 타이머 만료 시 `handleSubmit()`이 자동 호출되며, 미답변 문항은 빈 문자열(`""`)로 패딩되어 20문항 전체가 서버로 전송된다.

**코드 경로:**

```
[타이머 만료]
  → use-diagnosis-timer.ts:32-35 — onExpireRef.current() 호출
  → diagnosis-test.tsx:32-34 — handleSubmit() = submit(answers)
  → use-diagnosis-quiz.ts:30-33 — selectedText: answersById[q.id] ?? ""
  → format-answers.ts:32 — "" !== correctOption.text → isCorrect: false
  → scoring.ts:18 — 가중치 점수 계산 → A1
```

`features/diagnosis/hooks/use-diagnosis-quiz.ts:26-38`:

```typescript
const submit = useCallback(
  (answersById: Record<string, string>) => {
    if (questions.length === 0) return;
    submitMutation.mutate({
      answers: questions.map((q) => ({
        questionId: q.id,
        // 미답변 문항은 빈 문자열로 전송
        selectedText: answersById[q.id] ?? "",
      })),
    });
  },
  [questions, submitMutation]
);
```

`features/diagnosis/hooks/use-diagnosis-timer.ts:32-35`:

```typescript
if (remaining === 0 && !hasExpired) {
  hasExpired = true;
  clearInterval(timer);
  onExpireRef.current(); // handleSubmit() 무조건 호출
}
```

**점수 계산 시뮬레이션:**

가중치: A1=1, A2=2, B1=3, B2=4, C1=5
최대 가중치 합: 6×1 + 5×2 + 4×3 + 3×4 + 2×5 = **50**

| 시나리오 | 정답 가중치 합 | 점수 | 배정 레벨 |
|----------|---------------|------|-----------|
| A1 6문항만 정답 | 6 | 12 | A1 |
| A1+A2 전부 정답 (11문항) | 16 | 32 | A2 |
| 5문항만 답변 (전부 정답) | ~5-10 | 10-20 | A1 |
| 미답변 (0문항) | 0 | 0 | A1 |

가중치 기반 스코어링에서 고난이도 미답변은 분모를 크게 키우므로, 저난이도 문항만 맞혀도 A1-A2에 머문다.

### 원인 2: 프로필 자동 생성 시 기본값 A1을 진단 결과처럼 표시

`GET /api/profile/stats`는 UserProfile이 없을 때 `level: "A1"`로 자동 생성한다.

`app/api/profile/stats/route.ts:33-55`:

```typescript
// 프로필이 없으면 기본값 생성
if (!profile) {
  const newProfile = await prisma.userProfile.create({
    data: {
      userId,
      level: "A1", // DB 스키마 기본값
      totalXP: 0,
    },
  });

  return NextResponse.json({
    level: newProfile.level, // "A1" 반환
    hasCompletedDiagnosis: false,
    // ...
  });
}
```

응답에 `hasCompletedDiagnosis: false`가 포함되어 있지만, UI는 이 값을 레벨 표시에 활용하지 않는다.

`views/main/ui/progress-section.tsx:78-89` — 메인 페이지:

```typescript
<StatCard
  icon="🏆"
  label="현재 레벨"
  value={level} // diagnosisCompleted 와 무관하게 "A1" 표시
  gradient="indigo"
  isLoading={isLoading}
  footer={
    <div className="flex items-center gap-2 text-sm text-purple-600">
      <span className="font-semibold">진단 기반 맞춤 학습</span>
    </div>
  }
/>
```

`views/dashboard/ui/index.tsx:46-54` — 대시보드:

```typescript
<OverviewStats
  // ...
  level={profile?.level ?? "A1"} // hasCompletedDiagnosis 미전달
  // ...
/>
```

`views/dashboard/ui/overview-stats.tsx:25-27`:

```typescript
<p className="text-sm text-purple-600 font-medium">
  레벨: {level} // 무조건 표시
</p>
```

**사용자 경험 시나리오:**

```
1. 회원가입 → 메인 페이지 방문 → /api/profile/stats 호출
2. UserProfile 자동 생성 (level: "A1")
3. 메인 페이지에 "현재 레벨: A1" 표시
4. 진단 시작 → 몇 문항 답변 → 페이지 이탈
5. 다시 메인 페이지 → 여전히 "현재 레벨: A1"
6. 사용자: "진단도 안 끝냈는데 왜 A1이지?"
```

### 현재 보호 장치의 한계

| 보호 장치 | 위치 | 커버 범위 | 미커버 |
|-----------|------|-----------|--------|
| Zod 스키마 20문항 강제 | `entities/question/lib/schemas.ts:29` | 구조적 검증 | 빈 문자열 허용 (의도된 설계) |
| `preventDiagnosisRetake()` | `shared/lib/diagnosis-guards.ts:77` | 30일 쿨다운 | 미완료 진단에 대한 처리 없음 |
| `canSubmit` UI 가드 | `diagnosis-test.tsx:82` | 수동 제출 버튼 비활성화 | 타이머 자동 제출 경로 미차단 |
| `beforeunload` 경고 | 미구현 | - | 브라우저 이탈 경고 없음 |

## Proposed Changes

### 변경 1: 최소 답변 수 상수 추가

**파일:** `shared/constants/diagnosis.ts`

```typescript
export const DIAGNOSIS_TIME_LIMIT_SECONDS = 300;
export const TOTAL_DIAGNOSIS_QUESTION_COUNT = 20;
export const MIN_DIAGNOSIS_ANSWERS = 10; // 50% 기준
```

**근거:** 문항 분포(A1=6, A2=5, B1=4, B2=3, C1=2)에서 최소 2개 난이도 레벨을 커버해야 의미 있는 변별이 가능하다. 10문항은 A1+A2 전체(11문항)에 근접하며, 이 이상 답변해야 B1 이상 난이도 문항도 포함될 가능성이 생긴다.

### 변경 2: 서버 측 미충분 답변 거부

**파일:** `app/api/diagnosis/submit/route.ts`

Zod 검증 통과 후, 스코어링 전에 비어있지 않은 `selectedText`를 카운트한다. `MIN_DIAGNOSIS_ANSWERS` 미만이면 진단 기록을 생성하지 않고 400 응답을 반환한다.

```typescript
import { MIN_DIAGNOSIS_ANSWERS } from "@/shared/constants";

// Zod 검증 후, 스코어링 전 (기존 line 28 이후)
const { answers } = validation.data;
const answeredCount = answers.filter((a) => a.selectedText.trim() !== "").length;

if (answeredCount < MIN_DIAGNOSIS_ANSWERS) {
  return NextResponse.json(
    {
      error: "INSUFFICIENT_ANSWERS",
      message: `최소 ${MIN_DIAGNOSIS_ANSWERS}개 문항에 답해야 진단이 완료됩니다`,
      answeredCount,
      requiredCount: MIN_DIAGNOSIS_ANSWERS,
    },
    { status: 400 }
  );
}
```

이 가드는 Zod 스키마(20문항 구조 강제)와 별개의 비즈니스 규칙이다. 기존 Zod 스키마는 변경하지 않는다.

### 변경 3: 클라이언트 타이머 만료 처리 분기

**파일:** `features/diagnosis/ui/flow/diagnosis-test.tsx`

타이머 `onExpire` 콜백을 `handleSubmit`에서 새 `handleTimerExpire`로 교체한다.

```typescript
const [timerExpiredInsufficient, setTimerExpiredInsufficient] = useState(false);

const handleTimerExpire = useCallback(() => {
  const answeredCount = Object.keys(answers).length;
  if (answeredCount >= MIN_DIAGNOSIS_ANSWERS) {
    submit(answers);
    return;
  }
  setTimerExpiredInsufficient(true);
}, [submit, answers]);

const { minutes, seconds, timePercentage, isTimeWarning } =
  useDiagnosisTimer(timeLimit, handleTimerExpire);
```

`timerExpiredInsufficient`가 `true`이면 만료 안내 컴포넌트를 렌더링한다.

```typescript
if (timerExpiredInsufficient) {
  return (
    <DiagnosisExpired
      answeredCount={Object.keys(answers).length}
      requiredCount={MIN_DIAGNOSIS_ANSWERS}
      onGoHome={() => router.push("/")}
      onRetry={() => {
        setTimerExpiredInsufficient(false);
        setAnswers({});
        setCurrentIndex(0);
        refetchQuestions();
      }}
    />
  );
}
```

### 변경 4: 타이머 만료 안내 컴포넌트

**파일 (신규):** `features/diagnosis/ui/status/diagnosis-expired.tsx`

기존 `DiagnosisError` 패턴을 따르는 전체 화면 안내 컴포넌트.

```typescript
interface DiagnosisExpiredProps {
  answeredCount: number;
  requiredCount: number;
  onGoHome: () => void;
  onRetry: () => void;
}

export function DiagnosisExpired({
  answeredCount,
  requiredCount,
  onGoHome,
  onRetry,
}: DiagnosisExpiredProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏰</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-purple-950 mb-3">
          시간이 만료되었습니다
        </h2>
        <p className="text-purple-700 mb-2">
          {answeredCount}개 문항에 답변하셨습니다.
        </p>
        <p className="text-purple-700 mb-8">
          정확한 진단을 위해 최소 {requiredCount}개 문항에
          답변해야 합니다. 다시 시도해 주세요.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-gradient-to-br from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            다시 시도하기
          </button>
          <button
            onClick={onGoHome}
            className="px-8 py-4 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 변경 5: 브라우저 이탈 경고 훅

**파일 (신규):** `features/diagnosis/hooks/use-unsaved-diagnosis-warning.ts`

```typescript
"use client";

import { useEffect } from "react";

export function useUnsavedDiagnosisWarning(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn]);
}
```

`DiagnosisTest`에서 사용:

```typescript
const hasAnswers = Object.keys(answers).length > 0;
useUnsavedDiagnosisWarning(hasAnswers && !isSubmitSuccess);
```

**커버 범위:**
- 브라우저 탭 닫기, 뒤로 가기, URL 직접 변경 → `beforeunload` 경고 표시
- Next.js App Router 클라이언트 내비게이션 → `(immersive)` 라우트 그룹에 내비게이션 링크가 없으므로 실질적 위험 없음

### 변경 6: 메인 페이지 레벨 표시 조건부 처리

**파일:** `views/main/ui/progress-section.tsx`

`diagnosisCompleted` prop을 레벨 표시에도 활용한다.

```typescript
// JSX return 전에 계산
const levelDisplay = diagnosisCompleted ? level : "미진단";
const levelFooter = diagnosisCompleted
  ? "진단 기반 맞춤 학습"
  : "레벨 진단을 완료해주세요";

// StatCard에 적용
<StatCard
  icon="🏆"
  label="현재 레벨"
  value={levelDisplay}
  gradient="indigo"
  isLoading={isLoading}
  footer={
    <div className="flex items-center gap-2 text-sm text-purple-600">
      <span className="font-semibold">{levelFooter}</span>
    </div>
  }
/>
```

### 변경 7: 대시보드 레벨 표시 조건부 처리

**파일:** `views/dashboard/ui/index.tsx`

`hasCompletedDiagnosis` prop을 `OverviewStats`에 전달한다.

```typescript
<OverviewStats
  // ... 기존 props
  hasCompletedDiagnosis={profile?.hasCompletedDiagnosis ?? false}
/>
```

**파일:** `views/dashboard/ui/overview-stats.tsx`

```typescript
interface OverviewStatsProps {
  // ... 기존 props
  hasCompletedDiagnosis: boolean;
}

// 컴포넌트 내부
const levelText = hasCompletedDiagnosis ? `레벨: ${level}` : "진단 미완료";

// footer에 적용
<p className="text-sm text-purple-600 font-medium">
  {levelText}
</p>
```

## 수정 대상 파일 요약

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `shared/constants/diagnosis.ts` | 수정 | `MIN_DIAGNOSIS_ANSWERS` 상수 추가 |
| `app/api/diagnosis/submit/route.ts` | 수정 | 비충분 답변 서버 거부 로직 |
| `features/diagnosis/ui/flow/diagnosis-test.tsx` | 수정 | 타이머 만료 핸들러 분리 + 만료 상태 렌더링 |
| `features/diagnosis/ui/status/diagnosis-expired.tsx` | **신규** | 타이머 만료 안내 UI |
| `features/diagnosis/hooks/use-unsaved-diagnosis-warning.ts` | **신규** | `beforeunload` 경고 훅 |
| `views/main/ui/progress-section.tsx` | 수정 | 진단 미완료 시 "미진단" 표시 |
| `views/dashboard/ui/index.tsx` | 수정 | `hasCompletedDiagnosis` prop 전달 |
| `views/dashboard/ui/overview-stats.tsx` | 수정 | 진단 미완료 시 "진단 미완료" 표시 |

## Implementation Plan

### 단계 1: 기반 상수 + 서버 가드 (변경 1, 2)

의존성 없음. 서버 측 방어벽을 먼저 구축한다.

1. `shared/constants/diagnosis.ts`에 `MIN_DIAGNOSIS_ANSWERS` 추가
2. `app/api/diagnosis/submit/route.ts`에 답변 수 검증 로직 추가

### 단계 2: 클라이언트 타이머 처리 (변경 3, 4, 5)

단계 1에 의존. 서버 가드가 있으므로 클라이언트가 우회하더라도 안전하다.

1. `features/diagnosis/ui/status/diagnosis-expired.tsx` 생성
2. `features/diagnosis/hooks/use-unsaved-diagnosis-warning.ts` 생성
3. `features/diagnosis/ui/flow/diagnosis-test.tsx` 수정

### 단계 3: UI 레벨 표시 수정 (변경 6, 7)

단계 1, 2와 독립. 병렬 진행 가능.

1. `views/main/ui/progress-section.tsx` 수정
2. `views/dashboard/ui/index.tsx` + `views/dashboard/ui/overview-stats.tsx` 수정

## Expected Outcomes

### 정량적 개선

- 미완료 진단으로 인한 A1 오배정 **완전 제거** (서버 거부)
- 타이머 만료 자동 제출 시 10문항 미만 답변 → **진단 기록 미생성**
- 진단 미완료 사용자에게 "A1" 대신 **"미진단" / "진단 미완료"** 표시

### 정성적 개선

- 사용자가 진단 미완료 상태임을 명확히 인지
- `beforeunload` 경고로 의도치 않은 이탈 방지
- 타이머 만료 시 안내 화면으로 재시도 유도

### 하위 호환성

- 기존에 정상 완료된 진단 기록(`LevelDiagnosis`)에 영향 없음
- 기존 UserProfile의 `level` 필드 값 변경 없음 (`hasCompletedDiagnosis`로 UI 분기만 추가)
- Zod 스키마 변경 없음 (비즈니스 규칙으로 별도 검증)

## 검증 방법

1. **타입 체크:** `npx tsc --noEmit`
2. **린트:** `npm run lint`
3. **빌드:** `npm run build`
4. **수동 테스트:**
   - 진단 시작 → 5문항 답변 → 타이머 만료 대기 → "시간 만료" 안내 표시 확인 + DB에 `LevelDiagnosis` 미생성 확인
   - 진단 시작 → 15문항 답변 → 타이머 만료 → 정상 제출 + 레벨 할당 확인
   - 진단 미완료 상태에서 메인 페이지 → "미진단" 표시 확인
   - 진단 미완료 상태에서 대시보드 → "진단 미완료" 표시 확인
   - 진단 완료 후 메인/대시보드 → 실제 CEFR 레벨 표시 확인
   - 진단 중 브라우저 탭 닫기 → "Leave site?" 경고 확인
   - "다시 시도하기" 버튼 → 새 문항 로드 + 타이머 리셋 확인

## References

- FSD 아키텍처: `docs/architecture/fsd-architecture-guidelines.md`
- UI 구조 가이드: `docs/architecture/ui-structure-guidelines.md`
- 코드 스타일: `docs/conventions/code-style.md`
- 파일 네이밍: `docs/conventions/file-naming.md`
- 관련 스펙: `docs/specs/spec-diagnosis-scoring-policy.md` (서버 측 판정과 점수 버전 정책)
