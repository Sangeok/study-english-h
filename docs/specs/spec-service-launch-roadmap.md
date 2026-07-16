---
doc_type: spec
status: in-progress
owner: "@HamSangEok"
last_updated: 2026-07-16
target_release: "phase-4"
links:
  - issue: "TBD"
    ai_component: none
---

# 실서비스 런치 로드맵 — 실행 상태와 차기 우선순위

## Overview

디자인 리뉴얼(ADR-0001, Premium Modern) 이후 실서비스 공개까지의 착수 순서와 종료 조건을 관리하는 실행 로드맵이다.
초안은 기능 후보의 우선순위를 제안했지만, 2026-07-13 코드베이스 재검증 결과 여러 항목이 이미 구현됐고 일부는 구현과 출시 준비 상태가 달랐다.
따라서 이 문서는 아이디어 목록이 아니라 **현재 구현 상태, 공개 런치 게이트, 다음 작업 순서의 기준 문서**로 사용한다.

> **현재 위치 (2026-07-16)**: Tier 1-3 Core 파이프라인과 콘텐츠 Batch 1·2·3·4·5·6·7·8·9·10(Vocabulary 누적 3,100개·Quiz 누적 600문항 추가)을 완료해 Quiz와 Vocabulary 모두 최소 3배 목표를 달성했다. 다음 작업은 **Vercel WAF Publish·실제 Kakao/DB E2E와 staging 비파괴 seed**를 수행해 운영 환경 게이트를 닫는 것이다.
> 공개 런치 기준으로는 콘텐츠 수량 게이트는 닫혔지만 staging/외부 배포 검증이 남아 있어 **Tier 1 완료 전, Tier 2 진입 전**이다.
> Tier 0의 `scoringVersion` 정책은 선택 B(출시 전 미도입·위험 수용·향후 변경 전 도입)로 종료됐다.

### 상태 용어

| 상태 | 의미 |
|---|---|
| 완료 | 요구 동작과 해당 검증 경로가 모두 닫힘 |
| 구현 완료·검증 보강 | 사용자 동작은 연결됐으나 통합/실브라우저 검증이 남음 |
| 진행 중 | 핵심 일부가 구현됐지만 종료 조건을 충족하지 못함 |
| 미착수 | 사용자에게 실행 가능한 기능이 없음 |
| 보류 | 의도적으로 기능 구현을 시작하지 않음 |

## 의사결정 축

| 축 | 결정 | 함의 |
|---|---|---|
| 프로젝트 목적 | **실서비스 우선** | 기술 과시성 기능보다 유입·리텐션·콘텐츠가 우선 |
| 사용자 현황 | **공개 배포 전 / 실사용자 데이터 없음** | 리텐션 인프라보다 첫 경험과 콘텐츠 볼륨이 먼저. 실제 호스팅·운영 DB·OAuth 운영 설정은 저장소만으로 검증되지 않음 |
| 비용 제약 | **런타임 고정비 최소화** | 오디오는 개발 시점에 사전 생성하고 런타임에는 파일 URL을 우선 재생하며 브라우저 TTS로 폴백. 푸시는 Web Push(VAPID) 기준 |

## Current State — 2026-07-16 코드 검증

### 구현된 기반

- CEFR 레벨 진단 20문항과 서버 채점, 옵션 셔플, 중도 이탈 방어
- 데일리 퀴즈 완료 루프와 플래시카드 SRS(복습/신규)
- 게이미피케이션(리그·스트릭·업적·XP 상점), 카카오 로그인, 대시보드
- 단어·예문·퀴즈 결과 문장의 오디오 URL 재생과 브라우저 `speechSynthesis` 폴백
- 로그인 없는 진단 시작·미저장 preview·versioned cache·카카오 OAuth 복원·원자적 계정 이관과 단계별 실패 복구
- 콘텐츠 validate/build/report, fail-closed artifact 생성, 공식 비파괴/reset seed 계약
- 플래시카드 신규 카드의 exact-level 우선 adjacent fallback
- 대시보드의 7일 정답률·학습 시간·활동량 통계

### 현재 핵심 공백

콘텐츠 규모 게이트는 Quiz 887문항과 고유 Vocabulary 4,650개로 두 최소 3배 종료 기준을 모두 달성했다. 5배 수량은 상한 목표이지 공개 런치 필수 조건이 아니다.

1. **게스트 진단 배포 검증** — 앱 구현과 자동 계약 테스트는 완료됐지만 Vercel WAF Publish, 실제 Kakao 승인·취소, 실제 PostgreSQL 동시 제출 검증 기록이 없다.
2. **콘텐츠 staging 반영** — Core와 Batch 1·2·3·4·5·6·7·8·9·10 검증은 완료했지만 실제 DB 비파괴 seed와 레벨·카테고리 분포 확인은 아직 수행하지 않았다.
3. **재방문 채널** — 설치형 PWA, Web Push, 이메일 알림이 없다.
4. **학습 모드** — 매칭·선택형·타이핑·리스닝은 비활성 카드와 타입 스캐폴딩만 있고 실행 라우트가 없다.

## Proposal — 티어별 실행 상태

### Tier 0 — 런치 블로커 완료

보안과 진단 중도 이탈 블로커는 구현됐다. 관련 진단 스펙 2건도 현재 `status: implemented`다.
점수 버전 정책은 2026-07-12 선택 B로 확정되어 Tier 0 정책 게이트도 종료됐다.

| 항목 | 상태 | 현재 근거 | 유지·후속 조건 |
|---|---|---|---|
| 서버 채점과 입력 방어 | **완료** | 클라이언트는 `{ questionId, selectedText }`만 제출하고, 서버가 DB의 정답·난이도·카테고리로 채점. 20문항 고정, 중복 ID, 미존재 ID를 거부 | 조작 payload와 19/21문항·중복·미존재 ID 회귀 검증 유지 |
| 옵션 셔플과 정답 메타데이터 차단 | **완료** | 진단과 데일리 퀴즈 모두 응답 시점에 옵션을 셔플하고 옵션의 `isCorrect`를 노출하지 않음 | 반복 호출 시 위치가 고정되지 않는지 회귀 검증 유지 |
| 타이머 만료·중도 이탈 A1 오배정 방지 | **완료** | 10문항 미만이면 결과를 저장하지 않고 `DiagnosisExpired` 재시도 화면으로 전환. 서버도 최소 답변 수를 강제하고 미진단 UI를 별도로 표시 | 9답 이하 미저장, 10답 이상 정상 제출, 재시도 초기화 시나리오 유지 |
| `LevelDiagnosis.scoringVersion` | **정책 완료 — 의도적으로 미도입** | 공개 전 데이터는 테스트 데이터로 취급하고 현재 코드에 버전 필드·재진단 플래그를 추가하지 않음 | 첫 공개 사용자 진단 이후 규칙 변경 전에 별도 RFC로 버전 도입 |

#### 확정 정책: scoringVersion 선택 B

- 공개 출시 전에는 `scoringVersion`, `CURRENT_SCORING_VERSION`, `needsRediagnosis`를 구현하지 않는다.
- 현재 진단 기록은 개발·테스트 데이터로 취급하며 과거 진단 조건 간 비교 가능성을 보장하지 않는다.
- 선택 B 자체로 DB 레코드를 자동 삭제하지 않는다. 테스트 데이터 정리가 필요하면 별도 범위·백업·승인을 거친다.
- 첫 공개 사용자 진단 시점의 규칙을 개념적 `v1` 기준선으로 고정한다.
- 공개 출시 이후 임계값·약점/추천 규칙·문항 분포·힌트/문항 형식을 변경하기 전에는 버전 도입을 선행한다.

세부 데이터 취급과 향후 도입 트리거는 `docs/specs/spec-diagnosis-scoring-policy.md`를 따른다.

### Tier 1 — 공개 배포 전: 첫 경험과 콘텐츠

#### 1-1. 발음 듣기(TTS)

**상태: 완료**

초안의 브라우저 TTS 단독안보다 확장된 형태로 구현됐다.

- `Vocabulary.audioUrl`, `Vocabulary.exampleAudioUrl`, `QuizQuestion.sentenceAudioUrl`에 사전 생성된 오디오 URL을 저장한다.
- 플래시카드 앞면의 단어, 뒷면의 예문, 퀴즈 제출 후 상세 결과의 완성 문장을 재생한다.
- `shared/lib/play-audio.ts`가 URL을 우선 재생하고, URL이 없거나 `Audio.play()`가 실패하면 `speechSynthesis(en-US)`로 폴백한다. 최종 재생 가능 여부를 `Promise<boolean>`으로 반환해 404와 브라우저 미지원이 겹친 경로도 호출부가 처리한다.
- 런타임에서 Deepgram API를 호출하지 않는다.

완료 근거(2026-07-12):

- `shared/lib/play-audio.test.ts`가 파일 재생 성공, URL 없음 폴백, `Audio.play()` reject 후 폴백 성공, reject 후 폴백 불가, URL·폴백 모두 없음의 5개 분기를 고정한다.
- `features/flashcard/ui/flow/flashcard-game.test.tsx`가 앞면 단어와 뒷면 예문의 텍스트·URL 전달 및 미지원 토스트를 검증한다.
- `features/quiz/ui/result/quiz-detail-results.test.tsx`가 완성 문장·URL 전달과 URL 없음·브라우저 미지원 토스트를 검증한다.
- 현재 구성된 원격 DB에서 Vocabulary 1,550개와 QuizQuestion 287개를 확인했고 `audioUrl`, 예문 대상 `exampleAudioUrl`, `sentenceAudioUrl`의 NULL은 모두 0건이다.
- 단어·예문·퀴즈 공개 URL 표본은 각각 HTTP 206, `audio/mpeg`, MP3 시그니처로 응답했다.
- 두 배치를 `--limit 1`로 재실행해 모두 `생성 대상: 0개`, 성공 0, 실패 0인 no-op을 확인했다.
- `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build`가 통과했다. lint에는 기존 폰트 관련 warning 1건만 남았다.

검증한 로컬 `.env`의 원격 DB/R2가 실제 배포 플랫폼 설정과 동일한지는 저장소만으로 증명할 수 없다. 이 매핑과 실제 호스팅 확인은 아래 Tier 1 운영 환경 게이트에서 계속 관리하며, 배포 환경이 다르면 같은 읽기 전용 산출물 검증을 다시 실행한다.

#### 1-2. 게스트 레벨 진단 온보딩

**상태: 구현 완료·검증 보강 — 외부 배포 게이트 남음**

세부 구현 기준은 `docs/specs/spec-guest-diagnosis-onboarding.md`를 따른다. 공개 배포 대상은 Vercel로 확정했고 익명 API 보호는 Vercel WAF Rate Limiting으로 수행한다.

구현된 실행 흐름:

```text
게스트 홈 CTA
  → /diagnosis
  → GET /api/diagnosis/start
  → POST /api/diagnosis/preview (서버 채점, DB 미저장)
  → Zod 검증 가능한 versioned sessionStorage 쓰기
  → 인라인 CEFR 결과 + cache 준비 후 카카오 CTA
  → OAuth 성공 시 홈, 취소·오류 시 결과 복원
  → status 선조회 + 인증 /api/diagnosis/submit 재전송
  → 사용자별 DB 잠금 + 쿨다운 재검사
  → LevelDiagnosis + UserProfile 단일 커밋
  → cache 삭제와 진단·프로필 화면 갱신
```

기존 진단 이력이 있는 계정은 게스트 결과로 덮어쓰지 않는다. 저장 전 실패에는 캐시를 유지하고, core 저장 뒤 cache 삭제·화면 갱신 실패는 submit과 분리된 재시도만 제공한다.

완료된 구현·자동 검증:

- 사용자별 advisory lock, 30일 재검사, 진단·프로필 단일 트랜잭션, 409 duplicate suppression
- core commit 뒤 best-effort 게이미피케이션과 실패 시 `gamification: null` 성공 응답
- versioned Zod cache, 손상·접근 오류 판별, OAuth 결과 복원, cache 준비 전 CTA 차단
- status→submit→409 확인 래퍼와 core·cache clear·query refresh 단계별 재시도
- route·storage·API·hook·flow·OAuth result·home gate 7개 테스트 파일 68개와 2026-07-13 전체 151개 테스트 통과
- TypeScript, ESLint, production build 통과. ESLint에는 기존 폰트 warning 1건만 남음

남은 종료 조건:

1. Vercel WAF에 `start`·`preview` 합산 IP당 30회/60초 fixed-window 규칙을 Log 관찰 후 기본 429로 Publish하고 규칙 ID·조건·시각을 남긴다.
2. staging에서 실제 카카오 승인·취소, OAuth 홈 복귀, DB 이관·캐시 삭제를 확인한다.
3. 실제 PostgreSQL 두 동시 submit이 `200 + 409`, 진단 1건, 보상 1회로 끝나는지 확인한다.

#### 1-3. 콘텐츠 확장과 파이프라인

**상태: 진행 중 — Core와 Batch 1·2·3·4·5·6·7·8·9·10 및 Quiz·Vocabulary 3배 완료, staging seed 미완료**

세부 기준은 `docs/specs/spec-english-content-pool-expansion.md`를 따른다. Phase 1~4와 열 개 검수 batch, Quiz·Vocabulary 최소 3배 수량은 완료됐다. 실제 staging 비파괴 seed와 분포 확인이 남아 Tier 1-3 전체 상태는 진행 중이다.

| 단계 | 현재 상태 | 구현/미완료 요약 |
|---|---|---|
| Phase 1 — 감사·선행 정리·CEFR 단일화 | **완료** | generated artifact ignore, 공식 source registry, CEFR 공유, 구현 spec 추적과 legacy 경계 명시 |
| Phase 1.5 — regression 가드 | **완료** | learned ID 제외와 exact-first 우선순위를 Vitest로 고정 |
| Phase 2 — validate/build/report | **완료** | conflict hard fail, direct build gate, stale artifact 무효화, conflict 0 큐레이션과 테스트 완료 |
| Phase 3 — generated artifact seed | **완료** | 공식 seed 4명령, CLI `--reset`, artifact-first, transaction·오류 전파 테스트 완료 |
| Phase 4 — adjacent fallback | **완료** | exact → 인접 하위 → 인접 상위 우선순위와 단일 후보 쿼리·정렬 테스트 구현 |

현재 생성 리포트 기준:

| 지표 | 기준 시점 | 현재 | 최소 3배 종료 기준 | 5배 상한 목표 |
|---|---:|---:|---:|---:|
| Quiz | 287 | 887 | 861 | 1,435 |
| Vocabulary 고유 단어 | 1,550 | 4,650 | 4,650 | 7,750 |
| Vocabulary source rows | 1,564(큐레이션 후) | 4,664 | 참고 지표 | 참고 지표 |
| Quiz–vocabulary 겹침 | 130 / 45.3% | 705 / 80.0% | 분포·coverage 검증 통과 | 분포·coverage 검증 통과 |

현재 중복 리포트는 중복 단어 14개, complete 14개, **conflict 0개**를 기록한다. Quiz 고유 단어는 881개이며 그중 705개가 vocabulary와 겹쳐 coverage는 80.0%다.

Core 파이프라인 완료 근거:

1. collision report, `content:check`, vocabulary direct build가 conflict를 hard fail한다.
2. conflict 76건을 큐레이션해 0건으로 만들고 후행 80행은 legacy archive에 보존했다. complete 14건만 warning + collapse한다.
3. 공식 seed 4명령과 CLI `--reset`, artifact-first, transaction·오류 전파 계약을 테스트했다.
4. validate/report/build hard fail에서 이전 data artifact를 무효화한다.
5. 구현 spec과 seed 변경이 Git 변경 상태에 나타나며 legacy JSON과 conflict archive는 공식 source에서 제외된다.
6. `content:check`, 151개 테스트, TypeScript, ESLint, production build가 통과했다.

Batch 1 완료 근거:

1. Vocabulary 300개를 A1~C2 각 50개씩 추가하고 의미·IPA·예문·카테고리·CEFR 및 레벨 적합성을 교차 검수했다.
2. Quiz 150문항을 A1~C2 각 25문항씩 추가했다. 레벨·카테고리 조합마다 5문항이며 비-idiom 120문항은 공식 vocabulary와 같은 레벨·카테고리로 연결된다.
3. CEFR 난이도, 문법·오답 선택지, 한국어 힌트·의미를 독립적으로 재검수했다.
4. 기존 source prefix 보존, 새 key·문장 중복 0, 전체 선택지 집합 중복 0을 확인했다.
5. validate → collision → coverage → build, 151개 테스트, TypeScript, ESLint, production build가 통과했다. 실제 DB seed는 실행하지 않았다.

Batch 2 완료 근거:

1. Vocabulary 300개를 A1~C2 각 50개씩 추가하고 의미·IPA·예문·카테고리·CEFR을 교차 검수했다.
2. Quiz 150문항을 A1~C2 각 25문항, 레벨·카테고리 조합마다 5문항으로 추가했다. 비-idiom 120문항은 공식 vocabulary의 같은 단어·레벨·카테고리와 exact-link되고 idiom은 30문항이다.
3. 독립 검수에서 발견한 A2 난이도 불일치 12건, 문장·오답 모호성, `access`의 명사·동사 sense 불일치를 수정했다.
4. 기존 source prefix를 보존하고 새 key·문장·정규화 선택지 집합 중복 0, 깨진 문자 0을 확인했다.
5. `content:check` 결과 Quiz 587, Vocabulary source 2,164행/고유 2,150, conflict 0, coverage 65.1%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 3 완료 근거:

1. Vocabulary 300개를 A1~C2 각 50개씩 추가하고 의미·발음·예문·카테고리·CEFR을 교차 검수했다.
2. Quiz 150문항을 A1~C2 각 25문항, 레벨·카테고리 조합마다 5문항으로 추가했다. 비-idiom 120문항은 같은 batch vocabulary의 동일 단어·레벨·카테고리와 exact-link되고 idiom은 30문항이다.
3. 레벨 쌍을 나눠 생성한 뒤 서로 다른 검수자가 CEFR 난이도, 단어 sense, 문장 자연스러움, 한국어 힌트와 오답 선택지를 교차 검수하고 발견 사항을 수정했다.
4. 기존 source prefix와 Batch 3 suffix의 deep equality를 확인했으며 새 단어·Quiz key·문장·정규화 선택지 집합 중복과 깨진 문자는 모두 0건이다.
5. `content:check` 결과 Quiz 737, Vocabulary source 2,464행/고유 2,450, conflict 0, coverage 70.0%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 4 완료 근거:

1. Vocabulary 300개를 A1~C2 각 50개씩 추가하고 의미·발음·예문·카테고리·CEFR을 교차 검수했다.
2. Quiz 150문항을 A1~C2 각 25문항, 레벨·카테고리 조합마다 5문항으로 추가했다. 비-idiom 120문항은 같은 batch vocabulary의 동일 단어·레벨·카테고리·한국어 의미와 exact-link되고 idiom은 30문항이다.
3. 독립 검수에서 발견한 CEFR sense, 복합명사 강세, 법률·항공 개념 경계, 관용구 표제형·정답 유일성 문제를 수정하고 여섯 임시 파일을 다시 합동 검증했다.
4. 기존 source prefix와 Batch 4 suffix의 deep equality를 확인했으며 새 단어·Quiz key·문장·정규화 선택지 집합 중복과 깨진 문자는 모두 0건이다.
5. `content:check` 결과 Quiz 887로 최소 목표 861을 달성했다. Vocabulary source 2,764행/고유 2,750, conflict 0, coverage 71.9%이며 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 5 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 300개를 A1~C2 각 50개씩 추가했다. 레벨별 네 카테고리는 12~13개로 균형 배분했다.
2. 기존 Quiz에만 있던 비-idiom 후보를 우선 검토하되 같은 레벨·카테고리·sense와 독립 학습 가치를 모두 만족한 69개만 exact-link했다. 공식 source의 같은 의미 포함형과 내부 근접 중복은 새 표제어로 교체했다.
3. 레벨 쌍별 생성자와 다른 검수자가 의미·US IPA·복합어 강세·CEFR·카테고리·예문을 교차 검수했다. `check in` 동사와 공식 `check-in` 명사처럼 의도적인 품사 구분만 근접 표기로 유지했다.
4. 세 공식 source의 기존 prefix와 Batch 5 suffix가 각각 deep-equal이고 Quiz source SHA-256이 변경 전과 같음을 확인했다. 새 단어·예문 중복과 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 3,064행/고유 3,050, conflict 0, coverage 79.7%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 6 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 300개를 A1~C2 각 50개씩 추가했다. 레벨별 네 카테고리는 12~13개로 균형 배분했다.
2. 남은 Quiz-only 후보를 검토했지만 레벨·카테고리·sense 또는 독립 학습 가치가 맞지 않아 exact-link를 강제하지 않았다.
3. 레벨 쌍별 생성자와 다른 검수자가 의미·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수하고, 공식 단어와의 하이픈·단복수·포함형·동일 lemma 및 사실상 같은 개념을 비교해 불명확한 항목을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 6 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,050개가 새 artifact에도 같은 내용으로 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256도 변경 전과 같고 새 단어·예문 중복과 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 3,364행/고유 3,350, conflict 0, coverage 79.7%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 7 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 300개를 A1~C2 각 50개씩 추가했다. 레벨별 네 카테고리는 12~13개, 전체 카테고리별로는 75개씩 균형 배분했다.
2. 남은 Quiz-only 후보를 검토했지만 레벨·카테고리·sense 또는 독립 학습 가치가 맞지 않아 exact-link를 강제하지 않았고 신규 exact-link는 0개다.
3. 레벨 쌍별 생성자와 다른 검수자가 의미·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·하이픈/공백·단복수·lemma·포함형·사실상 같은 개념을 비교해 불명확하거나 수준이 맞지 않는 항목을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 7 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,350개가 새 artifact에도 같은 내용으로 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256도 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 3,664행/고유 3,650, complete 14, conflict 0, coverage 79.7%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 8 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 300개를 A1~C2 각 50개씩 추가했다. 레벨별 네 카테고리는 12~13개, 전체 카테고리별로는 75개씩 균형 배분했다.
2. exact-link를 강제하지 않았지만 의미가 일치하는 기존 Quiz 단어 2개가 자연스럽게 연결되어 overlap은 702개에서 704개로 늘었다.
3. 레벨 쌍별 생성자와 다른 검수자가 의미·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·compact·단복수·lemma·단어순서·포함형·사실상 같은 개념을 비교하고 단순 조합 표현과 불명확한 항목을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 8 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,650개가 새 artifact에도 같은 내용으로 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256도 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 3,964행/고유 3,950, complete 14, conflict 0, coverage 79.9%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 9 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 300개를 A1~C2 각 50개씩 추가했다. 레벨별 네 카테고리는 12~13개, 전체 카테고리별로는 75개씩 균형 배분했다.
2. exact-link를 강제하지 않았고 신규 단어와 기존 Quiz의 exact-link는 0개여서 overlap은 704개로 유지됐다.
3. 레벨 쌍별 생성자와 다른 검수자가 의미·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·compact·단복수·lemma·단어순서·포함형·사실상 같은 개념을 비교하고, 지나치게 전문적이거나 독립 학습 가치가 낮은 항목과 불명확한 뜻·발음·예문을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 9 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,950개가 새 artifact에도 같은 내용으로 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source와 generated artifact의 SHA-256은 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 4,264행/고유 4,250, complete 14, conflict 0, coverage 79.9%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

Batch 10 완료 근거:

1. Quiz를 추가하지 않고 Vocabulary 400개를 추가했다. A1·A2·B1·B2·C1은 각 75개, C2는 25개를 배분해 generated artifact를 모든 레벨 775개로 맞췄고, 네 카테고리는 각각 100개씩 균형 배분했다.
2. exact-link를 강제하지 않았고 의미가 일치하는 기존 Quiz 단어 `metaphor` 1개가 자연스럽게 연결되어 overlap은 704개에서 705개로 늘었다.
3. 레벨 쌍별 생성자와 다른 담당자가 의미·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·compact·단복수·lemma·단어순서·포함형·사실상 같은 개념을 비교해 직접 파생형과 동의 개념을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 10 suffix가 각각 deep-equal이고, 기존 generated vocabulary 4,250개가 새 artifact에도 같은 내용으로 보존되며 신규 400개가 반영된 것을 확인했다. Quiz source와 generated artifact의 SHA-256은 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
5. `content:check` 결과 Quiz 887, Vocabulary source 4,664행/고유 4,650, complete 14, conflict 0, coverage 80.0%다. 151개 테스트, TypeScript, ESLint, production build도 통과했고 실제 DB seed는 실행하지 않았다.

남은 Tier 1-3 종료 조건:

1. staging에서 비파괴 seed와 레벨·카테고리 분포를 검증한다.

#### Tier 1 공개 배포 게이트

- [x] `scoringVersion` 선택 B 확정 — 출시 전 미도입·위험 수용·향후 규칙 변경 전 도입
- [ ] 공개 배포 전 테스트 진단 데이터 인벤토리와 필요 시 정리 계획 승인
- [x] TTS URL/폴백/미지원 최종 UI 검증
- [x] 게스트 진단 핵심 저장 원자성, duplicate suppression, cache·OAuth 실패 복구 자동 계약
- [ ] 게스트 진단 Vercel WAF Publish와 실제 Kakao·DB staging E2E
- [x] 콘텐츠 conflict 0건과 fail-closed pipeline
- [x] 정식 seed 명령과 비파괴/reset 회귀 검증
- [x] Quiz 861개 이상 — 현재 887
- [x] Vocabulary 고유 4,650개 이상 및 source/artifact 분포 검증 — 현재 4,650, 모든 레벨 775개
- [x] 2026-07-16 Batch 10 반영 기준 `npm run test`(151개), `npm run content:check`, `npx tsc --noEmit`, `npm run lint`, `npm run build` 통과
- [ ] `/diagnosis`, `/quiz`, `/flashcard`, 인증 콜백의 배포 대상 환경 수동 검증
- [ ] 운영 환경 변수, DB 마이그레이션, OAuth callback origin, 실제 호스팅 상태 확인

위 항목이 닫히기 전에는 공개 배포 완료 또는 Tier 2 진입으로 판정하지 않는다.

### Tier 2 — 공개 배포 직후: 리텐션 루프

| # | 항목 | 상태 | 선행조건·종료 조건 |
|---|---|---|---|
| 2-1 | **PWA + Web Push** | **미착수** | HTTPS 운영 origin, VAPID 키 정책, 권한 요청 UX, KST 스케줄러와 중복/재시도 정책을 먼저 확정. manifest·서비스 워커·구독/해지 API·만료 정리·인증된 발송 작업·알림 딥링크와 실패 테스트가 있어야 완료 |
| 2-2 | **플래시카드 매칭·타이핑** | **스캐폴딩만 존재** | `/flashcard/modes`의 비활성 카드와 타입 이름만 존재. 매칭·타이핑 실행 라우트, 정답 판정, 진행/완료/재시도, SRS·XP 단일 반영, 세션 mode 기록과 경계 테스트가 있어야 완료 |

선택형과 리스닝은 매칭·타이핑 이후로 유지한다. 리스닝은 1-1의 오디오 재생 기반을 재사용하되 별도 문제 유형과 평가 규칙이 필요하다.

### Tier 3 — 차별화

| 항목 | 상태 | 남은 범위 |
|---|---|---|
| 위클리 학습 리포트 | **부분 구현** | `/api/dashboard/period-stats?period=week`와 대시보드가 7일 정답률·학습 시간·활동량을 제공. 이전 주 대비 변화, 약점 변화, 레벨 진행, KST 주차 경계, 전용 리포트/푸시 딥링크가 남음 |
| 데일리 챌린지 | **미착수** | `dailyGoalMinutes`, `dailyGoalWords` 스키마 필드만 존재. 사용자·날짜별 챌린지 상태, 진행률, KST 재설정, 완료 보상과 중복 지급 방지가 필요 |

### 보류 — 스피킹 코치

**상태: 보류 정책 구현 완료, 기능은 의도적으로 미착수**

홈의 coming-soon 카드와 안내 토스트는 유지한다. STT, 발음 평가, 실행 라우트, 백엔드, 저장 모델, 유료 호출은 추가하지 않는다.
재개할 때는 별도 RFC에서 품질 평가 기준, 개인정보·동의, 공급자, 단가 상한을 먼저 결정한다.

## 착수 순서

```text
1-3 Core pipeline fail-closed·seed 계약 완성
  → 콘텐츠 Batch 1·2·3·4·5·6·7·8·9·10 완료(Quiz·Vocabulary 3배 달성)
  → Vercel WAF Publish·실제 Kakao/DB E2E + staging seed
  → Tier 1 공개 배포 게이트 전수 확인
  → [공개 배포]
  → 2-1 PWA + Web Push
  → 2-2 플래시카드 매칭·타이핑
  → Tier 3 차별화 항목
```

## Out of Scope

- 각 신규 기능의 상세 설계 — 착수 시 별도 스펙에서 확정
- 수익화(구독·광고) — 사용자 확보 이후 논의
- 모바일 네이티브 앱 — 현 단계에서는 PWA 우선
- 소셜 기능(친구·팔로우) — 현재 리그가 경쟁 축을 제공
- 스피킹 코치 구현 — 별도 재개 결정 전까지 보류
- 콘텐츠 canonical entry/sense 스키마 재설계 — 콘텐츠 파이프라인 후속 RFC 범위

## 상태 판정 근거

- `docs/adr/0001-premium-modern-design-direction.md` — 디자인 방향(완료)
- `docs/specs/spec-english-content-pool-expansion.md` — Core와 Batch 1·2·3·4·5·6·7·8·9·10 및 Quiz·Vocabulary 3배 완료, staging seed가 남은 콘텐츠 파이프라인 구현 스펙
- `docs/specs/spec-diagnosis-scoring-policy.md` — 서버 채점·옵션 셔플·힌트 제거 구현 상태와 `scoringVersion` 선택 B 정책
- `docs/specs/spec-diagnosis-incomplete-exit.md` — 중도 이탈·A1 오배정 방지 구현 상태
- `docs/specs/spec-guest-diagnosis-onboarding.md` — 게스트 cache·OAuth·원자적 이관·WAF 배포 계약과 검증 상태
- `prisma/data/generated/content-coverage.report.json` — 콘텐츠 수량·overlap의 최신 생성 리포트
- `prisma/data/generated/content-collisions.report.json` — 중복·conflict의 최신 생성 리포트
- `docs/TODOS.md` — 본 로드맵과 병행 가능한 기존 백로그

## 변경 기록

- 2026-07-09: 디자인 리뉴얼 이후 최초 티어별 우선순위 제안
- 2026-07-12: 코드베이스와 재정합화. Tier 0 문서 상태, TTS·게스트 진단·콘텐츠 파이프라인·Tier 2/3의 실제 진행 상태와 공개 배포 종료 조건 반영. 실행 중 문서 규칙에 따라 `docs/specs/spec-service-launch-roadmap.md`로 이동
- 2026-07-12: `scoringVersion` 선택 B 확정. 출시 전 미도입·테스트 데이터 위험 수용·공개 후 규칙 변경 전 버전 도입 정책 반영
- 2026-07-12: Tier 1-1 TTS의 비동기 실패 계약과 퀴즈 미지원 피드백을 보완하고 단위·UI·원격 DB/R2·멱등 재실행 검증을 완료. 다음 착수 항목을 Tier 1-2로 갱신
- 2026-07-12: Tier 1-2의 원자적 저장·중복 억제·best-effort 보상·versioned cache·OAuth 복원·단계별 재시도와 68개 계약 테스트를 완료. 다음 작업을 Vercel WAF Publish와 실제 Kakao·DB staging 검증으로 갱신
- 2026-07-13: Tier 1-3 Core의 conflict 0/fail-closed/stale artifact/공식 seed·reset 계약과 151개 테스트·정적 검증을 완료. 다음 작업을 새 콘텐츠 3배 확장으로 갱신하고 Vercel·staging 운영 검증을 후행 게이트로 이동
- 2026-07-13: 콘텐츠 Batch 1로 Vocabulary 300개와 Quiz 150문항을 검수·추가. 현재 Quiz 437/Vocabulary 고유 1,850, conflict 0, coverage 58.3%와 전체 테스트·정적 검증·production build 통과를 반영하고 다음 작업을 후속 검수 batch로 갱신
- 2026-07-14: 콘텐츠 Batch 2로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. 현재 Quiz 587/Vocabulary 고유 2,150, conflict 0, coverage 65.1%와 전체 검증 통과를 반영하고 다음 작업을 Batch 3으로 갱신
- 2026-07-14: 콘텐츠 Batch 3로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. 현재 Quiz 737/Vocabulary 고유 2,450, conflict 0, coverage 70.0%와 전체 검증 통과를 반영하고 다음 작업을 후속 검수 batch로 갱신
- 2026-07-14: 콘텐츠 Batch 4로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. Quiz 887로 최소 3배 목표를 달성하고 Vocabulary 고유 2,750, conflict 0, coverage 71.9%와 전체 검증 통과를 반영. 다음 작업을 Vocabulary 중심 후속 batch로 갱신
- 2026-07-15: Vocabulary 전용 Batch 5로 A1~C2 각 50개, 총 300개를 추가 교차 검수. 의미상 근접 중복을 제거하면서 기존 Quiz 69개를 exact-link해 Vocabulary 고유 3,050, conflict 0, coverage 79.7%와 전체 검증 통과를 반영. 다음 작업을 후속 Vocabulary 검수 batch로 유지
- 2026-07-15: Vocabulary 전용 Batch 6으로 A1~C2 각 50개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,050개 보존을 확인해 Vocabulary 고유 3,350, conflict 0을 달성했으며 Quiz와 coverage는 887문항·79.7%로 유지하고 전체 자동·정적 검증을 통과. 다음 작업을 후속 Vocabulary 검수 batch로 유지
- 2026-07-15: Vocabulary 전용 Batch 7로 A1~C2 각 50개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,350개 보존을 확인해 Vocabulary source 3,664행/고유 3,650개, conflict 0을 달성했으며 Quiz와 coverage는 887문항·79.7%로 유지하고 전체 자동·정적 검증을 통과. Vocabulary 최소 목표까지 1,000개가 남아 다음 작업을 후속 Vocabulary 검수 batch로 유지
- 2026-07-15: Vocabulary 전용 Batch 8로 A1~C2 각 50개, 카테고리별 75개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,650개 보존을 확인해 Vocabulary source 3,964행/고유 3,950개, conflict 0을 달성했다. 기존 Quiz 2개가 자연스럽게 exact-link되어 coverage는 704/881(79.9%)로 상승했고 전체 자동·정적 검증을 통과했다. Vocabulary 최소 목표까지 700개가 남아 다음 작업을 후속 Vocabulary 검수 batch로 유지
- 2026-07-16: Vocabulary 전용 Batch 9로 A1~C2 각 50개, 카테고리별 75개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,950개 보존을 확인해 Vocabulary source 4,264행/고유 4,250개, conflict 0을 달성했다. Quiz source·artifact와 coverage는 887문항·704/881(79.9%)로 유지했고 전체 자동·정적 검증을 통과했다. Vocabulary 최소 목표까지 400개가 남아 다음 작업을 최종 Vocabulary 검수 batch로 갱신
- 2026-07-16: 최종 Vocabulary Batch 10으로 A1~C1 각 75개와 C2 25개, 카테고리별 100개, 총 400개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 4,250개 보존 및 Quiz source·artifact 무변경을 확인해 Vocabulary source 4,664행/고유 4,650개, conflict 0과 모든 레벨 775개를 달성했다. `metaphor` 1개가 자연스럽게 연결되어 coverage는 705/881(80.0%)가 됐고 전체 자동·정적 검증을 통과했다. 다음 작업을 Vercel WAF Publish·실제 Kakao/DB E2E와 staging 비파괴 seed로 갱신
