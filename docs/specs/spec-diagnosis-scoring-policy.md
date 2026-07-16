---
doc_type: spec
status: implemented
owner: "@hamsangeok"
last_updated: 2026-07-12
target_release: "phase-4"
links:
  - issue: "TBD"
    ai_component: none
---

# 레벨 진단 보안·한국어 힌트 제거 및 점수 버전 정책

## 목적

레벨 진단을 클라이언트 신뢰에 의존하지 않는 문맥 기반 cloze 진단으로 유지하고,
공개 출시 전 점수 데이터의 호환성 처리와 향후 채점 규칙 변경 절차를 확정한다.

## 현재 구현 상태

| 범위 | 상태 | 현재 기준 |
|---|---|---|
| 서버 측 정답 판정 | **구현 완료** | 클라이언트는 `{ questionId, selectedText }`만 제출하고 서버가 DB의 정답·난이도·카테고리로 채점 |
| 응답 옵션 셔플 | **구현 완료** | 진단과 데일리 퀴즈가 응답 시점에 옵션을 셔플하며 `isCorrect`를 노출하지 않음 |
| 한국어 힌트 제거 | **구현 완료** | 진단 질문 UI와 진단 응답에서 `koreanHint`를 노출하지 않음 |
| 최소 답변 수·중도 이탈 방어 | **구현 완료** | 별도 스펙 `docs/specs/spec-diagnosis-incomplete-exit.md` 기준으로 10문항 미만 결과 저장을 차단 |
| `scoringVersion` | **의도적으로 미도입** | 2026-07-12 선택 B 확정. 공개 전 데이터 호환성 위험을 수용하고 향후 변경 직전에 도입 |

## 확정 결정 — 선택 B

2026-07-12 사용자가 다음 정책을 확정했다.

1. 공개 출시 전에는 `LevelDiagnosis.scoringVersion`을 추가하지 않는다.
2. `CURRENT_SCORING_VERSION`, `needsRediagnosis`, 버전 기반 쿨다운 우회와 재진단 UI/API를 만들지 않는다.
3. 현재 존재하는 진단 기록은 개발·테스트 데이터로 취급하며 서로 다른 과거 진단 조건 간 비교 가능성을 보장하지 않는다.
4. 선택 B 자체는 어떤 DB 레코드도 자동 삭제하거나 수정하지 않는다.
5. 첫 공개 사용자 진단이 생성되는 시점의 규칙을 서비스의 개념적 기준 버전 `v1`로 고정한다.
6. 공개 출시 이후 채점 결과에 영향을 주는 규칙을 변경하기 전에는 `scoringVersion` 도입을 선행한다.

이 결정은 공개 사용자 데이터가 아직 없다는 전제에서만 유효하다. 공개 또는 보존 의무가 있는 사용자 진단이 이미 존재하는 것으로 확인되면
선택 B의 전제가 깨지므로 데이터 정리나 출시를 진행하지 않고 버전 도입 정책을 다시 승인받는다.

## 공개 출시 전 데이터 게이트

선택 B는 데이터 삭제 승인이 아니다. 공개 배포 전에 다음 절차를 별도로 완료한다.

1. 운영 대상 DB에 외부 사용자 계정과 보존해야 할 진단 기록이 없는지 확인한다.
2. 테스트 진단을 정리할 필요가 있으면 삭제 범위·백업·복구 절차를 작성하고 명시적 승인을 받은 뒤 실행한다.
3. `LevelDiagnosis`만 삭제해 `UserProfile.level`과 `UserProfile.weaknessAreas`가 과거 테스트 결과로 남는 부분 정리를 금지한다.
4. 정리 후 미진단 UI, 신규 진단, 게스트 진단 이관을 배포 대상 환경에서 확인한다.
5. 공개 출시 기준 commit/release를 진단 규칙의 개념적 `v1` 기준점으로 기록한다.

현재 문서 변경에서는 DB를 읽거나 삭제하지 않는다.

## 현재 진단 기준선

공개 출시 시 별도 변경이 없다면 다음 규칙이 개념적 `v1` 기준선이다.

- 문항 수: 20개
- 분포: A1 6개, A2 5개, B1 4개, B2 3개, C1 2개
- 난이도 가중치: A1=1, A2=2, B1=3, B2=4, C1=5, C2=6
- CEFR 임계값: C2 96+, C1 81+, B2 61+, B1 41+, A2 21+, 그 미만 A1
- 약점 판정: 카테고리 정확도 60% 미만
- 추천 레벨 하향: 약점 영역이 3개 이상이면 CEFR 한 단계 하향
- 클라이언트 제출 계약: `{ questionId, selectedText }` 정확히 20개, 중복 ID 금지
- 최소 유효 답변 수: 10개

기준 소스는 `features/diagnosis/config/index.ts`, `features/diagnosis/lib/scoring.ts`,
`entities/question/lib/schemas.ts`, `shared/constants/diagnosis.ts`다.

## 런타임 불변식

1. 클라이언트가 보낸 `isCorrect`, `difficulty`, `category`는 채점에 사용하지 않는다.
2. 서버는 제출된 question ID로 DB 문항과 옵션을 다시 조회하고 `formatDiagnosisAnswers`로 채점한다.
3. 미존재 question ID, 답변 수 불일치, 중복 question ID와 최소 답변 수 미달은 저장 전에 거부한다.
4. 문제 응답에는 정답 메타데이터를 포함하지 않으며 옵션 순서는 응답 시점에 셔플한다.
5. 진단 질문 UI에는 한국어 뜻 힌트를 다시 노출하지 않는다.
6. 정상 재진단 쿨다운은 유지하며 버전 기반 우회 경로는 만들지 않는다.

## 향후 `scoringVersion` 도입 트리거

첫 공개 사용자 진단 이후 다음 중 하나를 변경하려면 코드 변경보다 먼저 별도 RFC에서 버전 정책을 승인한다.

- `mapScoreToCEFR` 임계값
- `analyzeWeaknesses` 임계값
- `getRecommendedLevel` 하향 조건
- `DIFFICULTY_WEIGHTS` 또는 `QUESTION_DISTRIBUTION`
- 힌트 노출, 문항 형식, distractor 정책처럼 진단 난이도를 실질적으로 바꾸는 변경
- 정답 판정이나 점수 계산 의미를 바꾸는 서버 로직

동일 출력을 보존하는 순수 리팩터는 버전 상승 대상이 아니지만, 기존 고정 시나리오 회귀 테스트로 출력 동일성을 증명해야 한다.

향후 최초 버전 도입 시 최소 계약:

1. 기존 공개 기준선 레코드를 `scoringVersion = 1`로 backfill한다.
2. 변경된 규칙으로 생성되는 신규 레코드를 `scoringVersion = 2` 이상으로 저장한다.
3. 과거 기록 표시, 재진단 필요 여부, 쿨다운 예외와 분석 표본 분리 정책을 같은 RFC에서 결정한다.
4. 버전 필드 추가 전에는 공개 출시 이후의 규칙 변경을 병합하지 않는다.

## 검증

현재 선택 B의 구조적 기대값:

- `prisma/schema.prisma`의 `LevelDiagnosis`에 `scoringVersion`이 없어야 한다.
- `shared/constants`에 `CURRENT_SCORING_VERSION`이 없어야 한다.
- 진단 상태 API와 클라이언트 타입에 `needsRediagnosis`가 없어야 한다.
- `app/api/diagnosis/submit/route.ts`는 DB 재조회 후 서버 채점을 수행해야 한다.
- `features/diagnosis/lib/question-generator.ts`는 옵션을 셔플하고 정답 메타데이터를 제거해야 한다.
- `features/diagnosis/ui/flow/diagnosis-question-card.tsx`는 `koreanHint`를 렌더링하지 않아야 한다.

PowerShell 검증 명령:

```powershell
rg -n "scoringVersion|CURRENT_SCORING_VERSION|needsRediagnosis" prisma app features shared entities
```

기대 결과는 **검색 결과 0건**이다. 향후 버전 도입 RFC가 승인되기 전까지 이 결과를 유지한다.

## Out of Scope

- 현재 턴에서 Prisma 스키마·마이그레이션·생성 클라이언트 변경
- 현재 진단 데이터의 자동 삭제 또는 프로필 초기화
- 버전 기반 강제/권장 재진단 UI
- CEFR·약점·추천 레벨 임계값 재보정
- A1/A2 distractor 일괄 개편

## History

- 2026-07-09: 서버 채점, 옵션 셔플, 한국어 힌트 제거 구현 상태 확인
- 2026-07-12: 선택 B 확정. 공개 전 호환성 위험 수용, 현재 코드 무변경, 공개 후 규칙 변경 전 버전 도입을 정책화
- 선택 A를 포함했던 기존 4단계 상세 계획은 `docs/archive/rfc-remove-diagnosis-korean-hint-four-phase-plan.md`에 보존
