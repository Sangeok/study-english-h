---
doc_type: spec
status: in-progress
owner: "@HamSangEok"
last_updated: 2026-07-16
target_release: "tier-1"
links:
  - issue: "TBD"
    ai_component: none
---

# 영어 콘텐츠 풀 확장과 검증·시드 파이프라인

## 1. 목적과 범위

이 문서는 기존 `rfc-english-content-pool-expansion.md`를 현재 코드와 실행 결과에 맞춰 승인된 구현 스펙으로 전환한 것이다. Tier 1-3의 목표는 다음 두 단계를 순서대로 완료하는 것이다.

1. **Core 파이프라인 마감**: source 검증, 충돌 차단, generated artifact 생성, 비파괴 seed와 명시적 reset을 재현 가능한 계약으로 고정한다.
2. **콘텐츠 3배 확장**: Core가 fail-closed 상태가 된 뒤 검수 가능한 작은 batch로 Quiz와 Vocabulary를 각각 기준 수량의 3배 이상으로 늘린다.

Phase 4의 플래시카드 인접 레벨 fallback과 Core 파이프라인은 구현·자동 검증을 마쳤다. 실제 Vercel 배포와 staging seed 실행은 별도 운영 게이트이며 아직 실행하지 않았다.

## 2. 2026-07-16 기준 상태

| 영역 | 상태 | 현재 증거 | 남은 작업 |
| --- | --- | --- | --- |
| Phase 1: 감사·CEFR 단일화 | 완료 | `shared/constants/cefr.ts`, 공식 source registry, generated ignore, spec 추적과 legacy 경계 | 유지 |
| Phase 1.5: 회귀 가드 | 완료 | learned ID 제외, exact-first 우선순위 테스트 | 유지 |
| Phase 2: validate/build/report | 완료 | conflict hard fail, stale artifact 무효화, conflict 0 큐레이션과 회귀 테스트 | 유지 |
| Phase 3: generated seed | 완료 | 공식 seed 4명령, CLI `--reset`, transaction과 오류 전파 테스트 | staging 실행 |
| Phase 4: fallback | 완료 | CEFR exact-first 인접 레벨 fallback | 유지 |
| 3배 콘텐츠 | 완료 | Batch 1·2·3·4·5·6·7·8·9·10 완료: Quiz 887(고유 단어 881), Vocabulary source 4,664행/고유 4,650개 | 품질 가드 유지; 실제 staging seed는 별도 운영 게이트 |

2026-07-16 최신 `npm run content:check`는 정식 vocabulary source 4,664행과 Quiz 887문항을 검사해 성공한다. Vocabulary는 고유 4,650개, conflict 0개, complete 14개다. Quiz 고유 단어는 881개이며 705개가 vocabulary와 겹쳐 coverage는 80.0%다. collision entrypoint와 vocabulary direct build는 conflict를 hard fail하고, validate/report/build hard fail은 이전 data artifact를 무효화한다.

## 3. 불변식

### 3.1 콘텐츠와 런타임

- Quiz 정식 source는 `prisma/data/quiz-questions.json` 하나다.
- Vocabulary 정식 source는 `prisma/scripts/lib/vocab-source.ts`의 `VOCAB_SOURCE_FILES`에 등록된 다음 6개 파일뿐이다.
  - `vocabularies.json`
  - `vocabularies-extra-a1-a2.json`
  - `vocabularies-extra-b1-b2.json`
  - `vocabularies-extra-c1-c2.json`
  - `vocabularies-extra-supplement.json`
  - `vocabularies-extra-inline.json`
- `vocabularies-backup.json`, `vocabularies-expansion.json`, `vocabularies-merged.json`, `vocabulary-expansion-large.json`은 legacy이며 validate/build/seed 입력이 아니다.
- Vocabulary 식별자는 현재 Prisma의 `word @unique`다. 다의어를 여러 행으로 보존하는 schema 변경은 이 작업 범위가 아니다.
- Quiz 식별자는 현재 `@@unique([difficulty, englishWord])` 계약을 유지한다.
- CEFR 값과 순서는 `shared/constants/cefr.ts`를 단일 source of truth로 사용한다.

### 3.2 최종 artifact 우선순위

- `prisma/data/generated/*.json`은 Git에 커밋하지 않는 로컬·CI 산출물이다.
- seed는 generated artifact만 읽으며 source fallback을 하지 않는다.
- artifact가 없거나 JSON 배열이 아니거나 비어 있으면 DB 접근 전에 실패한다.
- source 검증 또는 conflict gate가 실패하면 이전 성공 실행에서 남은 관련 data artifact를 제거한다. 실패한 실행 뒤 stale artifact가 seed 입력으로 남아서는 안 된다.
- 정식 aggregate seed 명령은 항상 `content:check`를 먼저 실행해 현재 source에서 artifact를 재생성한다.

## 4. Vocabulary 충돌 정책

### 4.1 분류와 종료 코드

정규화한 `word`가 같은 행을 다음처럼 분류한다.

- **complete**: `meaning`, `level`, `category`가 같다. warning으로 보고하고 build에서 first-wins collapse를 허용한다. 예문·발음 차이는 report의 원본 항목으로 계속 보존해 사람이 확인할 수 있어야 한다.
- **conflict**: 위 세 필드 중 하나라도 다르다. collision report, vocabulary build, `content:check`를 모두 exit 1로 실패시킨다.

Vocabulary build는 호출 순서에 의존하지 않고 자체적으로 같은 conflict gate를 실행해야 한다. 따라서 `content:build:vocabulary` 직접 호출로 gate를 우회할 수 없다.

### 4.2 76건 큐레이션 결정과 완료 결과

큐레이션 전 정식 source는 1,644행, 고유 단어 1,550개, 중복 단어 90개였다. 중복은 complete 14개와 conflict 76개였으며 conflict의 후행 발생은 총 80행이었다.

이번 큐레이션은 **배포 동작 보존**을 우선한다.

1. 기존 `VOCAB_SOURCE_FILES` 순서와 파일 내 순서에서 처음 등장해 현재 generated artifact와 DB 입력이 된 행을 canonical로 선택한다.
2. 같은 단어의 후행 conflict 80행은 정식 source에서 제외한다.
3. 제외한 행은 `prisma/data/legacy/vocabulary-conflicts-2026-07-13.json`에 원래 source 위치와 canonical 선택 근거를 함께 보존한다. 데이터는 삭제하지 않지만 공식 파이프라인 입력으로 복귀시키지 않는다.
4. 의미가 다른 다의어를 다시 서비스하려면 `word @unique` 식별자와 검색·학습 이력 영향을 별도 RFC에서 먼저 설계한다.
5. 큐레이션 전후 vocabulary generated artifact의 데이터가 동일해야 한다. 순서와 각 레코드의 모든 필드가 달라지면 회귀로 간주한다.
6. complete 14개는 현 정책대로 warning + collapse로 남긴다.

이 결정은 임의의 새 의미를 고르는 것이 아니라 이미 런타임에서 사용한 canonical 데이터를 명시적으로 source에 반영하는 무동작 변경이다.

큐레이션 후 정식 source는 1,564행, 고유 1,550개, complete 14개, conflict 0개다. 제외한 80행은 legacy archive에 보존됐으며 `artifactDeepEqualToPreCuration`은 `true`다.

## 5. 명령 계약

### 5.1 검증과 build

| 명령 | 계약 |
| --- | --- |
| `content:validate:vocabulary` | source schema를 검사하고 report를 기록한다. hard fail이면 stale vocabulary artifact를 제거하고 exit 1 |
| `content:validate:quiz` | Quiz schema, 선택지 4개, 정답 1개, 식별자 중복을 검사한다. hard fail이면 stale quiz artifact를 제거하고 exit 1 |
| `content:report:collisions` | report를 항상 기록한다. conflict 1건 이상이면 stale vocabulary artifact를 제거하고 exit 1 |
| `content:report:coverage` | 공통 category와 quiz-only category를 분리해 coverage report를 기록 |
| `content:build:vocabulary` | 시작 시 이전 artifact를 무효화하고 schema + conflict gate를 직접 통과한 경우에만 새 artifact 기록 |
| `content:build:quiz` | 시작 시 이전 artifact를 무효화하고 schema gate를 통과한 경우에만 새 artifact 기록 |
| `content:check` | validate → collision → coverage → build 순서. 첫 hard fail에서 중단 |

리포트 파일은 실패 원인을 설명하기 위해 남길 수 있지만 seed가 소비하는 `vocabularies.generated.json`과 `quiz-questions.generated.json`은 실패 시 남기지 않는다.

### 5.2 seed

| 명령 | 계약 |
| --- | --- |
| `content:seed:vocabulary` | 현재 vocabulary artifact를 비파괴 upsert |
| `content:seed:quiz` | 현재 quiz artifact를 비파괴 upsert. 사용자 시도 기록을 삭제하지 않음 |
| `content:seed:quiz:reset` | `tsx prisma/seed-quiz.ts --reset`. QuizQuestion 전체를 지우며 FK cascade로 옵션과 사용자 시도 기록도 삭제하는 명시적 파괴 명령 |
| `content:seed` | `content:check` 성공 후 vocabulary → quiz 순서로 비파괴 seed |

reset 활성화의 정본은 CLI flag `--reset` 하나다. `SEED_RESET=true`, `SEED_RESET=1` 같은 환경변수는 지원하지 않는다. 이 방식은 Windows와 배포 환경에서 동일하며 파괴 동작을 명령 이름과 인자에 노출한다.

- 기본 quiz seed는 `deleteMany`를 호출하지 않는다.
- reset은 `quizQuestion.deleteMany` 한 번만 호출한다. `QuizOption`과 `UserQuizAttempt`는 schema의 cascade를 사용한다.
- 두 seed는 batch 전체를 transaction으로 실행한다. 첫 DB 오류를 전파해 전체 transaction을 rollback하며 성공처럼 종료하지 않는다.
- build/check/test는 seed를 자동 실행하지 않는다. 실제 DB seed는 운영자가 명시적으로 실행한다.

## 6. 테스트 계약

최소 자동 검증은 다음을 포함한다.

- conflict report가 conflict를 분류하고 CLI/entrypoint 결과를 실패로 반환한다.
- vocabulary build는 conflict가 있으면 artifact를 만들지 않고, complete만 있으면 warning + collapse한다.
- validate/report/build hard fail 시 미리 존재하던 stale data artifact가 제거된다.
- Quiz build/validate hard fail도 같은 stale artifact 규칙을 지킨다.
- artifact missing/invalid/empty는 seed의 DB 접근 전에 실패한다.
- quiz 기본 seed는 reset delete를 호출하지 않는다.
- `--reset` 경로는 `quizQuestion.deleteMany`를 한 번 호출한 뒤 적재한다.
- upsert 오류는 성공 결과로 변환되지 않고 호출자까지 전파된다.
- package scripts에 공식 seed 명령 4개가 정확히 존재하고 aggregate는 파괴 명령을 포함하지 않는다.
- 실제 source의 conflict는 0이며 complete는 report에 남는다.
- 큐레이션 전후 generated vocabulary 데이터가 동일하다.

검증 순서는 다음과 같다.

1. `npm run test`
2. `npm run content:check`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npm run build`

DB를 변경하는 seed 명령은 자동 검증에서 실행하지 않는다.

2026-07-16 Batch 10 반영 실행 결과: 22개 파일의 151개 테스트, `content:check`(vocabulary source 4,664행/고유 4,650/conflict 0/complete 14, Quiz 887문항), TypeScript, ESLint, production build가 통과했다. ESLint에는 기존 font warning 1건만 남았고 실제 DB seed는 실행하지 않았다.

## 7. 3배 확장 계약

Core 파이프라인이 모두 녹색이 된 뒤에만 콘텐츠를 확장한다.

| 콘텐츠 | 기준 | 최소 종료 수량 | 5배 상한 목표 |
| --- | ---: | ---: | ---: |
| Quiz | 287 | 861 | 1,435 |
| Vocabulary 고유 단어 | 1,550 | 4,650 | 7,750 |

- 한 batch는 사람이 diff와 validation report를 검토할 수 있는 크기로 제한한다.
- 각 batch마다 validate → collision → coverage → build를 전부 통과시킨다.
- 수량만 채우기 위한 placeholder, 복제 문항, 의미만 살짝 바꾼 중복은 금지한다.
- CEFR/category 분포와 Quiz-Vocabulary overlap을 report로 비교한다.
- 3배 수량과 품질 검수가 끝나기 전에는 Tier 1-3 전체를 완료로 표시하지 않는다.

### 7.1 Batch 1·2·3·4·5·6·7·8·9·10 완료 결과

1. 열 batch에서 Vocabulary 3,100개를 누적 추가했다. Batch 1~4에서는 Quiz 600문항도 추가했고 Batch 5·6·7·8·9는 이미 달성한 Quiz 수량을 늘리지 않고 Vocabulary를 각각 300개씩 추가했다. 최종 Batch 10은 남은 레벨 편차를 해소하도록 Vocabulary 400개를 추가했다.
2. Batch 5는 기존 Quiz와 의미가 정확히 맞는 69개를 exact-link했다. Batch 6·7·8·9는 exact-link를 강제하지 않았고 Batch 8에서 2개가 자연스럽게 연결됐다. Batch 10에서도 같은 원칙을 유지해 의미가 일치하는 `metaphor` 1개만 연결했다.
3. Batch 6의 의미·미국식 IPA·예문·CEFR·카테고리를 레벨 쌍별로 생성한 뒤 서로 다른 담당자가 300개를 순환 교차 검수했다. 공식 단어와의 하이픈·단복수·포함형·동일 lemma 및 사실상 같은 개념을 비교하고, 난이도·뜻·발음·예문 경계가 불명확한 항목을 교체하거나 보정했다.
4. 세 공식 source의 기존 prefix와 Batch 6 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,050개가 새 artifact에서도 같은 내용으로 전부 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256도 변경 전과 같고 새 단어·예문 중복과 깨진 문자는 0건이다.
5. Batch 6 종료 시 Quiz는 887문항(고유 단어 881)을 유지한다. Vocabulary는 source 3,364행/고유 3,350개, conflict 0이고 coverage는 702/881(79.7%)다. `content:check`, 151개 테스트, TypeScript, ESLint, production build가 통과했고 DB seed는 실행하지 않았다.
6. Batch 7은 A1~C2 각 50개와 카테고리별 75개, 총 300개를 레벨 쌍별로 생성한 뒤 서로 다른 담당자가 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·하이픈/공백·단복수·lemma·포함형·사실상 같은 개념을 비교하고 CEFR·뜻·미국식 IPA·예문을 교정했다.
7. 세 공식 source의 기존 prefix와 Batch 7 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,350개가 새 artifact에서도 같은 내용으로 전부 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256은 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
8. Batch 7 종료 시 Quiz는 887문항(고유 단어 881)을 유지한다. Vocabulary는 source 3,664행/고유 3,650개, complete 14개, conflict 0이고 coverage는 702/881(79.7%)다. `content:check`, 151개 테스트, TypeScript, ESLint, production build가 통과했고 DB seed는 실행하지 않았다.
9. Batch 8은 A1~C2 각 50개와 카테고리별 75개, 총 300개를 레벨 쌍별로 생성하고 작성자와 다른 담당자가 순환 교차 검수했다. 단순 조합 표현, 동일 lemma·개념, 불명확한 뜻·미국식 IPA와 과도하게 겹치는 항목을 교체하거나 보정했다.
10. 세 공식 source의 기존 prefix와 Batch 8 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,650개가 새 artifact에서도 같은 내용으로 전부 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source SHA-256은 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
11. Batch 8 종료 시 Quiz는 887문항(고유 단어 881)을 유지한다. Vocabulary는 source 3,964행/고유 3,950개, complete 14개, conflict 0이고 coverage는 704/881(79.9%)다. `content:check`, 151개 테스트, TypeScript, ESLint, production build가 통과했고 DB seed는 실행하지 않았다.
12. Batch 9는 A1~C2 각 50개와 카테고리별 75개, 총 300개를 레벨 쌍별로 생성하고 작성자와 다른 담당자가 순환 교차 검수했다. 공식 6개 source와 신규 세 묶음 사이의 exact·compact·단복수·lemma·단어순서·포함형·사실상 같은 개념을 비교하고, 지나치게 전문적이거나 독립 학습 가치가 낮은 항목과 불명확한 뜻·미국식 IPA·예문을 교체하거나 보정했다.
13. 세 공식 source의 기존 prefix와 Batch 9 suffix가 각각 deep-equal이고, 기존 generated vocabulary 3,950개가 새 artifact에서도 같은 내용으로 전부 보존되며 신규 300개가 반영된 것을 확인했다. Quiz source와 generated artifact의 SHA-256은 변경 전과 같고 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이다.
14. Batch 9 종료 시 Quiz는 887문항(고유 단어 881)을 유지한다. Vocabulary는 source 4,264행/고유 4,250개, complete 14개, conflict 0이고 coverage는 704/881(79.9%)다. `content:check`, 151개 테스트, TypeScript, ESLint, production build가 통과했고 DB seed는 실행하지 않았다.
15. Batch 10은 Quiz를 추가하지 않고 Vocabulary 400개를 추가했다. A1·A2·B1·B2·C1은 각 75개, 기존에 50개 더 많았던 C2는 25개를 추가해 generated artifact를 모든 레벨 775개로 맞췄고, 네 카테고리는 각각 100개씩 배분했다. 기존 Quiz와 의미가 일치하는 `metaphor` 1개가 자연스럽게 exact-link됐다.
16. 레벨 쌍별 생성자와 다른 담당자가 뜻·미국식 IPA·CEFR·카테고리·예문을 순환 교차 검수했다. 공식 6개 source와 세 신규 묶음 사이의 exact·compact·단복수·lemma·단어순서·포함형·사실상 같은 개념을 비교해 직접 파생형과 동의 개념을 교체했다. 세 target의 기존 prefix와 Batch 10 suffix는 각각 deep-equal이고, 이전 generated vocabulary 4,250개는 내용이 모두 보존됐으며 Quiz source와 generated artifact의 SHA-256도 변경 전과 같다.
17. Batch 10 종료 시 Quiz는 887문항(고유 단어 881)을 유지한다. Vocabulary는 source 4,664행/고유 4,650개, complete 14개, conflict 0이고 coverage는 705/881(80.0%)다. 신규 단어·뜻·예문 중복, placeholder와 깨진 문자는 0건이며 151개 테스트, `content:check`, TypeScript, ESLint, production build가 통과했다. 실제 DB seed는 실행하지 않았다.

## 8. 완료 조건

Core 완료:

- [x] vocabulary conflict 0
- [x] hard fail에서 stale data artifact가 남지 않음
- [x] `content:check` 성공
- [x] 공식 seed 명령 4개와 비파괴/reset/오류 전파 테스트 성공
- [x] RFC가 이 spec으로 이동되고 `.gitignore`에서 추적 가능한 경로로 명시됨
- [x] legacy JSON과 conflict archive가 공식 source에서 제외됨

Tier 1-3 전체 완료 조건:

- [x] Core 완료 조건 전부 충족
- [x] Batch 1·2·3·4·5·6·7·8·9·10의 schema/collision/coverage/build 검증 성공
- [x] Quiz 861개 이상
- [x] Vocabulary 고유 4,650개 이상
- [x] Vocabulary 고유 4,650개 달성을 위한 최종 batch까지 schema/collision/coverage/build 검증 성공
- [ ] staging에서 비파괴 seed와 레벨·카테고리 분포 확인

## 9. 변경 이력

- 2026-07-13: 제안서를 구현 스펙으로 승격. 현재 Phase 1~4 상태와 실제 76 conflict를 반영하고 fail-closed, stale artifact, `--reset`, 공식 seed 명령, 기존 런타임 보존형 큐레이션 정책을 확정.
- 2026-07-13: Core 구현 완료. conflict 76건을 런타임 무변경 방식으로 큐레이션하고 fail-closed·stale artifact·transaction seed 계약과 151개 테스트 및 정적 검증을 통과. 3배 콘텐츠 확장과 staging seed는 미실행 상태로 유지.
- 2026-07-13: 콘텐츠 Batch 1로 Vocabulary 300개와 Quiz 150문항을 검수·추가하고 Quiz 437/Vocabulary 고유 1,850, coverage 58.3%를 달성.
- 2026-07-14: 콘텐츠 Batch 2로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. Quiz 587/Vocabulary 고유 2,150, conflict 0, coverage 65.1%와 전체 자동·정적 검증 통과를 반영.
- 2026-07-14: 콘텐츠 Batch 3로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. Quiz 737/Vocabulary 고유 2,450, conflict 0, coverage 70.0%와 전체 자동·정적 검증 통과를 반영.
- 2026-07-14: 콘텐츠 Batch 4로 Vocabulary 300개와 Quiz 150문항을 추가 교차 검수. Quiz 887로 최소 3배 목표를 달성하고 Vocabulary 고유 2,750, conflict 0, coverage 71.9%와 전체 자동·정적 검증 통과를 반영.
- 2026-07-15: Vocabulary 전용 Batch 5로 A1~C2 각 50개, 총 300개를 추가 교차 검수. 의미상 근접 중복을 제거하면서 기존 Quiz 69개를 exact-link해 Vocabulary 고유 3,050, conflict 0, coverage 79.7%와 전체 자동·정적 검증 통과를 반영.
- 2026-07-15: Vocabulary 전용 Batch 6으로 A1~C2 각 50개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,050개 보존을 확인해 Vocabulary 고유 3,350, conflict 0을 달성했으며 Quiz와 coverage는 887문항·79.7%로 유지하고 전체 자동·정적 검증을 통과.
- 2026-07-15: Vocabulary 전용 Batch 7로 A1~C2 각 50개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,350개 보존을 확인해 Vocabulary source 3,664행/고유 3,650개, conflict 0을 달성했으며 Quiz와 coverage는 887문항·79.7%로 유지하고 전체 자동·정적 검증을 통과. Vocabulary 최소 목표까지 1,000개가 남았다.
- 2026-07-15: Vocabulary 전용 Batch 8로 A1~C2 각 50개, 카테고리별 75개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,650개 보존을 확인해 Vocabulary source 3,964행/고유 3,950개, conflict 0을 달성했다. 기존 Quiz 2개가 자연스럽게 exact-link되어 coverage는 704/881(79.9%)로 상승했고 전체 자동·정적 검증을 통과했다. Vocabulary 최소 목표까지 700개가 남았다.
- 2026-07-16: Vocabulary 전용 Batch 9로 A1~C2 각 50개, 카테고리별 75개, 총 300개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 3,950개 보존을 확인해 Vocabulary source 4,264행/고유 4,250개, conflict 0을 달성했다. Quiz source·artifact와 coverage는 887문항·704/881(79.9%)로 유지했고 전체 자동·정적 검증을 통과했다. Vocabulary 최소 목표까지 400개가 남았다.
- 2026-07-16: 최종 Vocabulary Batch 10으로 A1~C1 각 75개와 C2 25개, 카테고리별 100개, 총 400개를 추가하고 순환 교차 검수. 기존 prefix·신규 suffix와 이전 generated 4,250개 보존 및 Quiz source·artifact 무변경을 확인해 Vocabulary source 4,664행/고유 4,650개, conflict 0과 모든 레벨 775개를 달성했다. `metaphor` 1개가 자연스럽게 연결되어 coverage는 705/881(80.0%)가 됐고 전체 자동·정적 검증을 통과했다. 콘텐츠 3배 확장은 완료됐으며 실제 staging 비파괴 seed만 운영 게이트로 남았다.
