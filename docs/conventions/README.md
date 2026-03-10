---
doc_type: spec
status: accepted
owner: "@team"
last_updated: 2026-03-10
target_release: "current"
links:
- issue: "TBD"
  ai_component: none
---

# 컨벤션 가이드

이 디렉터리는 Codex를 포함한 코드 작성 에이전트가 코드 작업 전에 반드시 검토해야 하는 필수 규범 문서 모음입니다.

## 적용 범위

- 모든 코드 변경, 리팩터링, 코드 생성, 코드 리뷰에 필수로 적용합니다.
- 프론트엔드, 서버, 스크립트, 설정 변경을 포함한 저장소 전체 코드 작업을 대상으로 합니다.
- 모든 문서는 반드시 읽되, 실제 규칙 적용은 각 문서에 명시된 적용 범위와 변경 대상 코드에 맞게 판단합니다.
- 문서 간 충돌이나 적용 범위가 모호하면 보수적으로 해석하고, 작업 전에 충돌을 먼저 보고합니다.

## 읽기 순서

1. 이 README를 먼저 읽습니다.
2. 아래 필수 문서를 모두 읽습니다.
3. 각 문서의 적용 범위를 확인한 뒤 변경 대상 코드에 반영합니다.

## 우선순위

- `docs/conventions/`는 코드 스타일과 설계 규칙의 최상위 기준입니다.
- 더 구체적인 문서가 더 일반적인 문서보다 우선합니다.
- 파일명 규칙은 `file-naming.md`가 일반 네이밍 규칙보다 우선합니다.
- React/TSX 스타일 규칙은 `code-style.md`가 일반 TypeScript 규칙보다 우선합니다.
- `AGENTS.md`의 일반 요약과 개별 컨벤션 문서가 충돌하면 `docs/conventions/` 기준을 따릅니다.

## 필수 문서

- [`code-style.md`](./code-style.md): React/TSX 스타일, 조건부 렌더링, 중첩 제한, lookup map, 조기 반환 규칙
- [`file-naming.md`](./file-naming.md): 파일명 규칙과 Next.js 예약 파일 예외
- [`frontend-cohesion-guide.md`](./frontend-cohesion-guide.md): 함께 바뀌는 코드의 배치, 코로케이션, 기능 단위 응집도 규칙
- [`frontend-coupling-guide.md`](./frontend-coupling-guide.md): 불필요한 공통화와 과한 공유 의존성을 줄이는 규칙
- [`frontend-predictability-guide.md`](./frontend-predictability-guide.md): 시그니처, 상태, 에러 처리, 반환 타입의 예측 가능성 규칙
- [`frontend-readability-guide.md`](./frontend-readability-guide.md): 이름 붙이기, 분리하기, 단순한 표현을 통한 가독성 규칙
- [`naming-conventions.md`](./naming-conventions.md): 함수, 변수, 상수, 타입, 인터페이스, 폴더 네이밍 규칙
- [`typescript-clean-code-guide.md`](./typescript-clean-code-guide.md): 일반 TypeScript 클린 코드 기준과 AI 코드 생성 체크리스트

## 문서별 적용 해석

- `file-naming.md`는 파일명에 대해 가장 구체적인 기준입니다.
- `naming-conventions.md`는 식별자 이름 전반의 기본 기준입니다.
- `code-style.md`는 React와 TSX 코드에서 가장 우선하는 스타일 기준입니다.
- `typescript-clean-code-guide.md`는 TypeScript 전반에 적용하는 일반 기준이며, 더 구체적인 문서가 없는 경우 기본값으로 사용합니다.
- `frontend-readability-guide.md`, `frontend-predictability-guide.md`, `frontend-cohesion-guide.md`, `frontend-coupling-guide.md`는 프론트엔드 구조와 표현 방식에 대한 보완 규칙입니다.

## 유지보수 규칙

- 이 디렉터리에 새 Markdown 문서가 추가되면 기본적으로 필수 문서로 간주합니다.
- 새 문서를 추가하거나 기존 문서를 이동, 삭제, 대체할 때는 이 README의 목록과 역할 설명도 같은 변경에서 함께 갱신합니다.
- 새로운 문서가 기존 규칙을 좁히거나 대체하면, 이 README에 우선순위와 적용 범위를 명시합니다.
