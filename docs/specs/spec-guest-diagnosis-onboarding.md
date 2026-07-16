---
doc_type: spec
status: in-progress
owner: "@HamSangEok"
last_updated: 2026-07-12
target_release: "phase-4"
links:
  - issue: "TBD"
    ai_component: none
---

# 게스트 레벨 진단 온보딩 신뢰성 스펙

## 1. 목적과 현재 상태

로그아웃 방문자는 `/diagnosis`에서 20문항을 풀고 서버 채점 결과를 본 뒤 카카오 로그인으로 결과를 계정에 저장한다. 게스트 답변과 미리보기 결과는 같은 탭의 `sessionStorage`에만 보관하며, 로그인 전에는 `LevelDiagnosis`나 `UserProfile`을 생성하지 않는다.

2026-07-12 기준 앱 코드와 자동 검증은 완료됐다.

- 진단·프로필 저장은 사용자별 PostgreSQL transaction advisory lock과 단일 Prisma 트랜잭션을 사용한다.
- 30일 내 최근·동시 제출은 core write와 보상 전에 409로 억제된다.
- 게이미피케이션 실패는 저장된 진단의 성공 응답을 바꾸지 않는다.
- versioned cache 검증, OAuth 취소 복원, cache 준비 전 CTA 차단, 단계별 재시도와 홈 migration gate가 구현됐다.
- 7개 계약 테스트 파일 68개를 포함한 전체 Vitest 138개가 통과한다.

문서 상태가 `in-progress`인 이유는 앱 구현이 아니라 다음 외부 배포 게이트가 남았기 때문이다.

- Vercel 프로젝트 Firewall에서 WAF rate-limit 규칙을 Log 관찰 후 429로 Publish해야 한다.
- staging에서 실제 카카오 승인·취소와 두 동시 submit의 DB·보상 결과를 확인해야 한다.

## 2. 확정 결정

### 2.1 게스트 캐시

- 저장소는 `sessionStorage`를 유지한다. 탭 종료 시 유실은 가입 유도용 임시 데이터라는 제품 의도에 포함한다.
- 캐시는 `cacheSchemaVersion`을 포함하고 Zod로 런타임 검증한다. 이 버전은 진단 채점 정책의 `scoringVersion`과 별개다.
- 읽기 결과는 `ready | empty | invalid | unavailable`, 쓰기·삭제 결과는 성공과 `unavailable`을 판별 가능한 타입으로 반환한다.
- `readGuestDiagnosis`는 손상 데이터를 몰래 삭제하지 않는다. 호출부가 손상 캐시를 명시적으로 폐기하거나 오류를 표시한다.
- OAuth CTA는 캐시 쓰기 성공 뒤에만 활성화한다.

### 2.2 OAuth 복귀와 결과 복원

- 카카오 성공 복귀는 `callbackURL: "/"`를 사용한다. 홈의 게스트 진단 이관 훅이 인증 상태에서 실행된다.
- 카카오 취소·오류 복귀는 `errorCallbackURL: "/diagnosis?oauth=cancelled"`를 사용한다.
- `/diagnosis`의 얇은 외부 경계가 캐시를 먼저 확인한다. 유효한 캐시가 있으면 퀴즈 훅을 마운트하지 않고 기존 결과와 CTA를 복원한다.
- 로그인 시작 실패와 OAuth callback 미완료를 구분해 사용자 메시지와 같은 화면의 재시도를 제공한다.

### 2.3 핵심 저장과 중복 억제

- `/api/diagnosis/submit`은 사용자별 PostgreSQL transaction advisory lock을 획득한다.
- 같은 Prisma 트랜잭션 안에서 최신 진단의 30일 쿨다운을 다시 검사한 뒤 `LevelDiagnosis.create`와 `UserProfile.upsert`를 실행한다.
- 최신 진단이 30일 미만이면 저장·프로필 갱신·게이미피케이션 없이 `409`를 반환한다.
- 30일 이상 지난 진단은 정상 재진단으로 새 기록을 허용한다.
- 응답 계약은 다음과 같다.

```json
{
  "error": "DIAGNOSIS_ALREADY_COMPLETED",
  "diagnosisId": "latest-diagnosis-id",
  "completedAt": "2026-07-12T00:00:00.000Z",
  "daysUntilRetake": 30
}
```

이 방식은 요청 식별자를 저장하는 엄밀한 멱등성이 아니라 사용자별 중복 억제다. 동일 요청인지 판별할 수 없는 상태에서 기존 결과를 무조건 200으로 반환하지 않는다. 게스트 이관 클라이언트는 409 후 status를 다시 조회해 완료 기록을 확인한 경우에만 이미 저장된 성공으로 종료한다.

### 2.4 게이미피케이션 실패 정책

- 진단과 프로필이 커밋된 뒤 게이미피케이션을 별도 실행한다.
- 게이미피케이션 실패는 진단 성공을 500으로 바꾸지 않는다. 오류에 `userId`와 `diagnosisId`를 남기고 200 응답의 `gamification`을 `null`로 반환한다.
- 자동 보상 재시도는 중복 보상 위험 때문에 이번 범위에 포함하지 않는다.

### 2.5 익명 API 보호

공개 배포 대상은 Vercel로 확정했다. 앱 내부 메모리 제한이나 임의의 `x-forwarded-for` 파싱 대신 함수 실행 전에 적용되는 Vercel WAF Rate Limiting을 사용한다.

| 항목 | 확정값 |
|---|---|
| 규칙 이름 | `diagnosis-anonymous-rate-limit` |
| 대상 | `/api/diagnosis/start` 또는 `/api/diagnosis/preview` |
| 알고리즘 | Fixed Window |
| 윈도우 | 60초 |
| 한도 | 두 경로 합산 IP당 30회 |
| 카운팅 키 | IP |
| 초과 응답 | 기본 429 |

한 규칙으로 두 경로를 묶어 Hobby 플랜의 프로젝트당 rate-limit 규칙 1개 제한과 호환한다. 정상 진단 한 회는 두 요청을 사용하므로 IP당 분당 최대 15회의 완전한 게스트 흐름을 허용한다.

WAF는 앱 세션을 해석하지 않으므로 `/api/diagnosis/start`의 인증 사용자 요청도 같은 카운터에 포함한다. 인증 사용자도 진단 시작 시 한 번만 호출하므로 이 제한을 수용하며, 앱 코드에서 세션별 우회 헤더를 추가하지 않는다.

WAF 카운터는 리전별로 계산되므로 전역 절대 한도가 아니다. 배포 전 10분 동안 Log로 관찰해 학교·회사 NAT 오탐을 확인한 뒤 기본 429로 전환하고 Publish한다. 대시보드 규칙 ID·조건·한도·Publish 시각을 배포 체크 기록에 남긴다.

rate-limit 동작은 `vercel.json`의 `deny/challenge` 규칙으로 대체하지 않는다. 최종 보호 산출물은 Vercel 프로젝트 Firewall 설정이다.

## 3. 목표 런타임 흐름

```text
게스트 /diagnosis
  → WAF 허용
  → GET /api/diagnosis/start
  → POST /api/diagnosis/preview
  → versioned sessionStorage 쓰기 성공
  → 결과 + 카카오 CTA 활성화
  → 카카오 성공: / 복귀
      → 캐시 읽기
      → status 선조회
      → submit
      → 사용자 잠금 + 쿨다운 재검사
      → LevelDiagnosis + UserProfile 단일 커밋
      → 캐시 삭제
      → 진단/프로필 쿼리 갱신
  → 카카오 취소: /diagnosis?oauth=cancelled 복귀
      → 캐시 결과 복원
      → 로그인 미완료 안내 + 같은 CTA 재시도
```

### 실패와 재진입

| 상황 | 캐시 | 서버 데이터 | 사용자 동작 |
|---|---|---|---|
| preview 실패 | 없음 | 없음 | 기존 진단 제출 오류에서 재시도 |
| cache 쓰기 실패 | 없음 또는 이전 값 | 없음 | CTA 비활성화, 저장 재시도 |
| OAuth 취소 | 유지 | 없음 | 복원된 결과 화면에서 재시도 |
| status/submit 네트워크 실패 | 유지 | 불명 또는 없음 | 홈 이관 오류 화면에서 재시도 |
| submit 성공 후 응답 유실 | 유지 | 저장됨 | 다음 status 확인으로 완료를 확인하고 캐시 삭제 |
| 기존 진단 계정 | 삭제 | 기존 기록 유지 | submit 없이 기존 결과 유지 |
| 동시·재마운트 제출 | 최종 삭제 | 새 기록 최대 1건 | 첫 요청 200, 후속 요청 409 확인 후 성공 종료 |
| 게이미피케이션 실패 | 삭제 | 진단·프로필 저장됨 | 진단 성공 유지, 보상 자동 재시도 없음 |

## 4. 구현 인벤토리

### 서버

- `app/api/diagnosis/submit/route.ts`: 트랜잭션, advisory lock, 쿨다운 재검사, 409 계약, 게이미피케이션 실패 분리
- `shared/constants/diagnosis.ts`, `shared/constants/index.ts`: 30일 쿨다운 상수의 단일 소유
- `shared/lib/diagnosis-guards.ts`: 쿨다운 계산 함수 공유
- `entities/user/api/get-streak-update-data.ts`: 잠금 뒤 같은 transaction client로 프로필을 읽어 stale streak 덮어쓰기를 방지
- `app/api/diagnosis/start/route.ts`, `app/api/diagnosis/preview/route.ts`: 앱 코드는 유지하고 Vercel WAF가 앞단에서 보호
- `prisma/schema.prisma`: 변경 없음. 재진단 이력을 보존해야 하므로 `LevelDiagnosis.userId` unique 제약을 추가하지 않는다.

### 클라이언트

- `features/diagnosis/lib/guest-diagnosis-storage.ts`: 버전·런타임 검증·판별 결과
- `features/diagnosis/api/diagnosis-api.ts`: 일반 submit 계약을 바꾸지 않는 게스트 이관 래퍼와 409 확인
- `features/diagnosis/model/use-guest-diagnosis-migration.ts`: 판별 상태, 명시적 재시도, 저장 결과와 화면 갱신 실패 분리
- `features/diagnosis/ui/flow/diagnosis-test.tsx`: 캐시 확인 외부 경계, 결과 복원, cache 쓰기 완료 전 CTA 차단
- `features/diagnosis/ui/result/guest-diagnosis-result.tsx`: callback/errorCallback, OAuth 상태·오류 안내
- `features/diagnosis/ui/status/guest-diagnosis-migration-notice.tsx`: 홈 이관 진행·실패·재시도 UI
- `features/diagnosis/ui/index.ts`, `features/diagnosis/index.ts`, `views/main/ui/index.tsx`: public API와 홈 조합점

### 테스트

- `app/api/diagnosis/submit/route.test.ts`
- `features/diagnosis/lib/guest-diagnosis-storage.test.ts`
- `features/diagnosis/api/diagnosis-api.test.ts`
- `features/diagnosis/model/use-guest-diagnosis-migration.test.tsx`
- `features/diagnosis/ui/flow/diagnosis-test.test.tsx`
- `features/diagnosis/ui/result/guest-diagnosis-result.test.tsx`
- `features/diagnosis/ui/status/guest-diagnosis-migration-notice.test.tsx`

## 5. 구현 순서

- [x] 쿨다운 상수·계산을 단일 소유점으로 모은다.
- [x] submit 저장을 사용자 잠금과 단일 트랜잭션으로 바꾸고 409 중복 억제 계약을 추가한다.
- [x] 게이미피케이션 오류를 핵심 저장 결과와 분리한다.
- [x] 캐시 스키마와 저장소 실패 계약을 구현한다.
- [x] OAuth 취소 결과 복원과 cache 준비 상태를 구현한다.
- [x] 게스트 이관 API 래퍼·상태·재시도 UI를 구현한다.
- [x] 단위·컴포넌트·route 계약 테스트를 실행한다.
- [ ] Vercel WAF를 Log로 관찰한 뒤 429로 Publish하고 실제 Kakao·DB 흐름을 staging에서 확인한다.

## 6. 검증

### 자동 검증

- 핵심 쓰기가 모두 transaction client를 사용하며 한쪽 실패 시 게이미피케이션이 실행되지 않는다.
- 최근 진단 제출은 409이고 core write와 보상이 없다.
- 30일 경계 이후 재진단은 허용된다.
- 게이미피케이션 reject 뒤에도 200과 `diagnosisId`가 반환된다.
- 손상 JSON, 잘못된 shape, cache version 불일치, storage read/write/remove 예외를 검증한다.
- cache 준비 전 OAuth CTA가 노출되지 않고 저장 실패 시 재시도할 수 있다.
- OAuth 요청에 `callbackURL`과 `errorCallbackURL`이 모두 포함된다.
- 401·네트워크·500은 캐시를 유지하고, 409는 status 완료 확인 후에만 캐시를 지운다.
- 저장 성공 후 query invalidation 실패가 submit 재실행을 유발하지 않는다.
- 캐시된 결과 복원 시 `useDiagnosisQuiz`가 마운트되지 않는다.
- `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build`를 통과한다.

2026-07-12 실행 결과:

- `npm run test`: 21개 파일, 138개 테스트 통과
- `npx tsc --noEmit`: 통과
- `npm run lint`: 오류 0건, 기존 `app/layout.tsx` 폰트 warning 1건
- `npm run build`: Next.js 16.1.6 production build 통과

### staging 수동 검증

1. WAF 규칙을 Log로 10분 관찰하고 예상 path만 집계되는지 확인한다.
2. 규칙을 기본 429로 전환·Publish한다.
3. 동일 IP에서 합산 30회까지 허용되고 31번째 요청이 429이며 window 이후 회복되는지 확인한다.
4. 위조한 `x-forwarded-for`로 카운터를 우회할 수 없는지 확인한다.
5. 실제 카카오 승인 왕복 후 홈 SSR이 인증을 인식하고 DB에 진단 1건만 생성되는지 확인한다.
6. 실제 카카오 취소 후 결과와 CTA가 복원되는지 확인한다.
7. 두 동시 submit이 `200 + 409`, 진단 1건, 진단 리그 포인트 1회로 끝나는지 확인한다.

## 7. 완료 정의

- 서버 핵심 저장이 원자적이고 최근·동시 중복 제출이 DB 쓰기 전에 억제된다.
- 핵심 저장 성공은 게이미피케이션 장애와 무관하게 성공으로 응답한다.
- 모든 복구 가능한 클라이언트 실패에 같은 화면의 재시도가 있으며 캐시 삭제 시점이 검증된다.
- Vercel WAF 규칙과 staging Kakao·DB 검증 기록이 남아 있다.
- 자동 검증 명령이 모두 통과한다.

## 8. 범위 제외

- `submissionId` 저장을 통한 엄밀한 idempotency key
- 게이미피케이션 보상 재처리 큐·관리자 보상 도구
- Redis/Upstash/PostgreSQL 기반 앱 내부 rate limiter
- Playwright와 테스트 OAuth 공급자 도입
- 게스트 데이터의 서버 영속화 또는 `localStorage` 전환
