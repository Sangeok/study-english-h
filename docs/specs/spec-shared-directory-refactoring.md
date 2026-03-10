---
doc_type: spec
status: implemented
owner: "@codex"
last_updated: 2026-03-10
target_release: "current"
links:
- issue: "TBD"
  ai_component: none
---

# shared 디렉터리 리팩토링 스펙

## 1. 요약

이 문서는 기존 `shared` 디렉터리 리팩토링 제안의 구현 완료 상태를 기록합니다.

구현 범위는 기존 RFC의 4.1, 4.2, 4.3입니다.

- 메인 화면 전용 프로필 통계 훅을 `shared` 밖으로 이동
- 최근 학습 활동 훅과 타입을 `recent-activity` widget 내부로 이동
- streak 순수 계산과 Prisma 접근을 분리

결과적으로 `shared/lib`는 공용 인프라 중심으로 정리되었고, 화면/위젯/도메인 소유권이 더 명확해졌습니다.

---

## 2. 구현 결과

### 2.1. 메인 화면 프로필 통계 훅 이동

다음 변경을 적용했습니다.

- `shared/lib/use-profile-stats.ts` 삭제
- `views/main/hooks/use-profile-stats.ts` 추가
- `views/main/ui/index.tsx`가 로컬 훅을 직접 import하도록 변경
- `shared/lib/index.ts`에서 `useProfileStats`, `ProfileStats` 재수출 제거

이 변경으로 `useProfileStats`는 더 이상 공용 shared 훅이 아니며, 메인 화면 소유 로직으로 취급됩니다.

### 2.2. 최근 학습 활동 훅 및 타입 이동

다음 변경을 적용했습니다.

- `shared/lib/use-recent-activity.ts` 삭제
- `widgets/recent-activity/model/activity-types.ts` 추가
- `widgets/recent-activity/model/use-recent-activity.ts` 추가
- `widgets/recent-activity/model/index.ts` 추가
- `widgets/recent-activity/ui/recent-activity.tsx`
- `widgets/recent-activity/ui/quiz-activity-card.tsx`
- `widgets/recent-activity/ui/flashcard-activity-card.tsx`
- `widgets/recent-activity/lib/activity-key.ts`
- `widgets/recent-activity/lib/flashcard-utils.ts`

위 파일들이 widget 내부 model을 직접 바라보도록 import를 정리했습니다.

또한 `shared/lib/index.ts`에서 아래 항목의 재수출을 제거했습니다.

- `useRecentActivity`
- `Activity`
- `QuizActivity`
- `FlashcardActivity`
- `QualityCounts`
- `RecentActivityResponse`

이 변경으로 최근 활동 응답 모델은 공용 계약이 아니라 widget 소유 모델이 되었습니다.

### 2.3. streak 순수 계산과 DB 접근 분리

다음 변경을 적용했습니다.

- `shared/lib/update-streak.ts` 삭제
- `entities/user/lib/streak.ts` 추가
- `entities/user/api/get-streak-update-data.ts` 추가
- `entities/user/index.ts`에서 순수 streak 함수와 타입만 public API로 노출

구체적으로 역할을 아래처럼 분리했습니다.

- `entities/user/lib/streak.ts`
  - `toKSTDateString`
  - `calculateStreakUpdate`
  - `calculateEffectiveCurrentStreak`
- `entities/user/api/get-streak-update-data.ts`
  - Prisma 기반 `getStreakUpdateData`

사용처도 함께 정리했습니다.

- DB 접근이 필요한 라우트는 `@/entities/user/api/get-streak-update-data`를 직접 import
- 순수 계산만 필요한 코드는 `@/entities/user` public API를 사용

이 변경으로 순수 도메인 규칙과 영속성 접근이 서로 분리되었습니다.

---

## 3. 최종 소유권 기준

현재 리팩토링 후 구조 기준은 다음과 같습니다.

- `shared/lib`
  - 전역 공용 인프라만 유지
  - 예: `api-client`, `api-types`, `query-keys`, `use-animated-counter`
- `views/main`
  - 메인 화면 전용 집계 훅과 관련 타입 보유
- `widgets/recent-activity`
  - 최근 활동 조회 훅, 관련 타입, 위젯 표현 모델 보유
- `entities/user`
  - streak 도메인 규칙의 순수 계산 보유
  - server-only profile/streak helper는 direct path import로 사용

---

## 4. 비대상 및 유지 항목

이번 리팩토링에서 다음 항목은 유지했습니다.

- `shared/lib/api-client.ts`
- `shared/lib/api-types.ts`
- `shared/lib/query-keys.ts`
- `shared/ui/query-provider.tsx`
- `shared/ui/feature-card.tsx`
- `shared/ui/stat-card.tsx`

다음 항목은 이번 구현 범위에 포함하지 않았습니다.

- `shared/lib/get-session.ts`
- `shared/lib/check-auth.ts`
- `shared/lib/diagnosis-guards.ts`
- 별도 `entities/activity` 도입
- 별도 `entities/profile` 도입

---

## 5. 검증

구현 후 아래 검증을 수행했습니다.

- `npx.cmd tsc --noEmit`
- `npm.cmd run lint`

두 검증 모두 통과했습니다.

---

## 6. 구현 결과 요약

이번 리팩토링으로 다음 상태를 만족합니다.

- `shared/lib/index.ts`가 화면 전용 훅과 widget 전용 훅을 더 이상 노출하지 않음
- 최근 활동 타입이 전역 shared 계약으로 남아 있지 않음
- streak 계산 규칙과 Prisma 접근 로직이 서로 다른 모듈로 분리됨
- server-only helper는 direct path import로만 사용됨

이 문서는 기존 `docs/proposals/shared-directory-refactoring-proposal.md`를 구현 완료 상태로 전환한 기준 문서입니다.
