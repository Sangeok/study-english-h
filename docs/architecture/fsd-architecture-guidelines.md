# Feature-Sliced Design (FSD) 아키텍처 가이드라인

이 문서는 프로젝트에 적용되는 **Feature-Sliced Design (FSD)** 아키텍처의 핵심 규칙과 구조를 정의합니다.

## 관련 문서

- UI 구조 가이드라인: `docs/architecture/ui-structure-guidelines.md`

## 1. 핵심 개념 (Core Concepts)

FSD는 프론트엔드 애플리케이션을 **Layers(계층) > Slices(슬라이스) > Segments(세그먼트)**의 3단계 계층 구조로 나눕니다.

- **Coupling(결합도) 낮춤**: 기능 단위로 분리하여 코드 간의 의존성을 관리합니다.
- **Cohesion(응집도) 높임**: 관련된 비즈니스 로직과 UI를 한 곳에서 관리합니다.

---

## 2. 계층 구조 (Layers)

프로젝트의 최상위 디렉토리는 다음과 같은 표준화된 계층으로 구성됩니다.
**엄격한 단방향 의존성 규칙**이 적용됩니다: **상위 계층은 하위 계층만 import 할 수 있습니다.**

(상위)

1.  **`app/`**
    - 애플리케이션의 진입점 및 전역 설정.
    - Provider, Router 설정, 전역 스타일, Layout 등이 위치합니다.
    - _Next.js App Router 사용 시 `app` 폴더 자체가 라우팅 역할을 겸하므로, FSD의 `app` 레이어 개념은 `app/(providers)`나 Root Layout 등에 녹여냅니다._

2.  **`views/`** (Next.js의 라우팅 폴더와 구분 필요, FSD 논리적 페이지)
    - 실제 라우트(페이지)를 구성하는 컴포넌트 (`Page` 컴포넌트).
    - `Widgets`, `Features`, `Entities`를 조합하여 완전한 화면을 구성합니다.
    - Next.js App Router 구조에서는 `app/[route]/page.tsx`가 이 역할을 수행하되, 복잡한 로직은 FSD의 `pages` 슬라이스로 위임하기도 합니다.

3.  **`widgets/`**
    - 독립적인 기능을 수행하는 거대 컴포넌트 덩어리.
    - 여러 `Features`와 `Entities`를 조합하여 만듭니다.
    - 예: `Header`, `Sidebar`, `PostFeed`, `VideoPlayerWidget`

4.  **`features/`**
    - 사용자의 비즈니스 행위(User Scenario)를 다루는 기능 단위.
    - 재사용 가능해야 하며, 비즈니스 가치를 가집니다.
    - 예: `AuthByEmail`, `LikeVideo`, `SearchVideo`, `CommentPost`

5.  **`entities/`**
    - 비즈니스 도메인 엔티티 (데이터 모델).
    - 데이터와 관련된 UI, 상태 등을 포함하지만 **행위(Behavior)는 포함하지 않는 것**이 원칙입니다. (단순 보여주기용 UI 등)
    - 예: `User`, `Video`, `Comment`, `Notification`
    - _주의: Entity 내에서는 다른 Entity를 import 할 수 없습니다._

6.  **`shared/`**
    - 특정 비즈니스 로직에 종속되지 않은 재사용 가능한 컴포넌트, 유틸리티, 라이브러리.
    - 프로젝트 전반에서 공통으로 사용됩니다.
    - 예: `UI Kit(Button, Input)`, `constants(전역 상수)`, `lib(axios, dates)`, `hooks`, `types`
    - 전역 상수는 `shared/constants`에 둡니다.

(하위)

---

## 3. 슬라이스 (Slices)

각 계층(`shared`와 `app` 제외)은 도메인별 폴더인 **Slice**로 나뉩니다.
Slice 이름은 비즈니스 도메인(예: `user`, `video`, `auth`)을 따릅니다.

- 예: `features/auth`, `entities/video`, `widgets/header`

## 4. 세그먼트 (Segments)

각 Slice 내부는 파일의 역할에 따라 다음과 같은 **Segment**로 나뉩니다.

- **`ui/`**: 리액트 컴포넌트 (`UserProfile.tsx`)
- **`model/`**: 비즈니스 로직, 상태 관리 (Zustand store), 데이터 처리 훅
- **`api/`**: 서버 통신 로직, API 요청 함수
- **`lib/`**: 해당 슬라이스 내부에서만 쓰이는 유틸리티 (선택적)
- **`constants/`**: 전역 상수 모음 (shared 레이어에서 주로 사용)
- **`config/`**: 설정 파일 (선택적)

### 디렉토리 구조 예시

```
src/
├── app/                  # App setup (Providers, Global Styles)
├── widgets/
│   └── Header/           # Widget Slice
│       ├── ui/           # UI Components
│       └── index.ts      # Public API
├── features/
│   └── Login/            # Feature Slice
│       ├── ui/
│       ├── model/        # Login Logic (State)
│       └── api/          # Login API
├── entities/
│   └── User/             # Entity Slice
│       ├── ui/           # UserCard, UserAvatar (Dumb Components)
│       └── model/        # User Type Definitions
└── shared/
    ├── ui/               # Generic UI (Button, Card)
    ├── constants/        # App-wide constants
    └── lib/              # Helpers
```

---

## 5. 의존성 규칙 (Dependency Rules)

FSD의 핵심은 **엄격한 의존성 관리**입니다.

1.  **Linear Flow (선형 흐름)**
    - **상위 레이어는 하위 레이어만 import 할 수 있습니다.**
    - 예: `features`는 `entities`와 `shared`를 사용할 수 있지만, `widgets`나 `pages`는 사용할 수 없습니다.
    - 예: `shared`는 프로젝트 내의 어떤 레이어도 import 할 수 없습니다.

2.  **Slice Isolation (슬라이스 격리)**
    - **같은 레이어 내의 다른 슬라이스는 서로 직접 import 할 수 없습니다.**
    - 예: `features/auth`는 `features/comment`를 import 할 수 없습니다.
    - _예외: `shared` 레이어는 슬라이스 개념이 약하므로 내부 import가 비교적 자유롭습니다._
    - 이 규칙은 높은 응집도와 낮은 결합도를 보장합니다.

3.  **Public API (공개 API)**
    - 각 Slice는 반드시 `index.ts` 파일을 통해 외부로 노출할 요소만 `export` 해야 합니다.
    - 외부에서는 Slice의 내부 파일(`features/auth/ui/LoginForm`)에 직접 접근하지 말고, Public API(`features/auth`)를 통해 접근해야 합니다.
    - Bad: `import { LoginForm } from 'features/auth/ui/LoginForm'`
    - Good: `import { LoginForm } from 'features/auth'`

---

## 6. 일반적인 고민과 해결 (FAQ)

**Q. 기능인지 엔티티인지 헷갈립니다.**

- **Entity**: "무엇인가? (Model)"에 집중. 데이터와 데이터를 보여주는 단순 UI (예: `UserCard`). 사용자 인터랙션 로직(버튼 클릭 시 API 호출 등)을 거의 포함하지 않음.
- **Feature**: "무엇을 하는가? (Action)"에 집중. 사용자 시나리오이자 비즈니스 가치 (예: `UpdateProfile`). Entity를 import하여 조작함.

**Q. 같은 레이어의 슬라이스끼리 데이터를 공유해야 한다면?**

- 데이터를 필요로 하는 상위 레이어(Widget 또는 Page)에서 데이터를 조합하여 하위로 내려주거나 컴포지션 패턴을 사용합니다.
- 또는, 공통 로직을 하위 레이어(`shared` 등)로 내리거나 리팩토링을 고려합니다.
