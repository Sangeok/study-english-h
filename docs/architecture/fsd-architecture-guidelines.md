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
    - **Widget은 조합(Composition) 계층**입니다. 화면에 필요한 데이터를 모으고 배치할 수는 있지만, 특정 도메인 테이블에 대한 직접 DB 조회 로직을 Widget이 소유해서는 안 됩니다.
    - Widget의 서버 로직은 하위 레이어의 API를 호출해 필요한 값을 조합하는 오케스트레이션에 집중합니다.
    - 예: `Header`, `Sidebar`, `PostFeed`, `VideoPlayerWidget`

4.  **`features/`**
    - 사용자의 비즈니스 행위(User Scenario)를 다루는 기능 단위.
    - 재사용 가능해야 하며, 비즈니스 가치를 가집니다.
    - 예: `AuthByEmail`, `LikeVideo`, `SearchVideo`, `CommentPost`

5.  **`entities/`**
    - 비즈니스 도메인 엔티티 (데이터 모델).
    - 데이터와 관련된 UI, 상태 등을 포함하지만 **행위(Behavior)는 포함하지 않는 것**이 원칙입니다. (단순 보여주기용 UI 등)
    - 특정 도메인 데이터의 조회/매핑 책임은 해당 Entity가 우선적으로 가집니다.
    - 예를 들어 `userProfile`, `quizQuestion`처럼 한 도메인 테이블/모델에 대한 DB 조회는 `entities/<domain>/api/`에 둡니다.
    - 예: `User`, `Video`, `Comment`, `Notification`
    - _주의: Entity 내에서는 다른 Entity를 import 할 수 없습니다._

6.  **`shared/`**
    - 특정 비즈니스 로직에 종속되지 않은 재사용 가능한 컴포넌트, 유틸리티, 라이브러리.
    - 프로젝트 전반에서 공통으로 사용됩니다.
    - 예: `UI Kit(Button, Input)`, `constants(전역 상수)`, `lib(axios, dates)`, `hooks`
    - 전역 상수는 `shared/constants`에 둡니다.
    - _주의: `shared/types` 폴더는 만들지 않습니다. 전역 타입은 목적에 맞는 세그먼트(예: `shared/config`, `shared/analytics`)에 배치합니다._

(하위)

---

## 3. 슬라이스 (Slices)

각 계층(`shared`와 `app` 제외)은 도메인별 폴더인 **Slice**로 나뉩니다.
Slice 이름은 비즈니스 도메인(예: `user`, `video`, `auth`)을 따릅니다.

- 예: `features/auth`, `entities/video`, `widgets/header`

## 4. 세그먼트 (Segments)

각 Slice 내부는 파일의 역할에 따라 다음과 같은 **Segment**로 나뉩니다.

- **`ui/`**: 리액트 컴포넌트 (`UserProfile.tsx`)
- **`model/`**: 비즈니스 로직, 상태 관리 (Zustand store), 데이터 처리 훅, 도메인 타입 정의
- **`api/`**: 서버 통신 로직, API 요청 함수, API 응답 타입, 서버 전용 데이터 접근 함수
- **`lib/`**: 해당 슬라이스 내부에서만 쓰이는 유틸리티 (선택적)
- **`constants/`**: 전역 상수 모음 (shared 레이어에서 주로 사용)
- **`config/`**: 설정 파일 (선택적)

> **세그먼트 네이밍 원칙**: 세그먼트 이름은 코드의 **목적**을 나타내야 하며, 코드의 **형태**를 나타내면 안 됩니다.
> `types`, `components`, `hooks`는 "무엇인가"를 설명하므로 세그먼트 이름으로 사용하지 않습니다.

### 서버 데이터 접근 배치 규칙

Next.js App Router에서는 서버 컴포넌트, route handler, server action 어디서든 서버 코드를 호출할 수 있으므로, "어디서든 `prisma`를 불러도 된다"는 식으로 구조가 쉽게 무너질 수 있습니다. 이 프로젝트에서는 아래 기준을 따릅니다.

1. **도메인 DB 접근 소유권은 가장 낮은 적절한 레이어에 둡니다.**
   - 단일 도메인 엔티티 조회는 `entities/<domain>/api/`
   - 사용자 행위 단위의 조합/저장은 `features/<feature>/api/`

2. **`widgets/`, `views/`, `app/`는 도메인 DB 쿼리를 직접 소유하지 않습니다.**
   - 이 레이어들은 하위 레이어 API를 호출해 화면용 데이터를 조합합니다.
   - 예: 헤더에서 프로필이 필요하면 `widgets/app-header/api/`가 직접 `prisma.userProfile`을 조회하는 대신 `entities/user/api/`를 호출합니다.

3. **상위 레이어의 `api/` 세그먼트는 오케스트레이션 전용입니다.**
   - 세션 확인, 여러 하위 API 결과 취합, 화면 전용 DTO 조립은 가능
   - 특정 도메인 테이블을 직접 조회하는 비즈니스 쿼리는 금지

4. **직접 DB 접근이 허용되는 예외는 전역 인프라 성격일 때만 제한적으로 인정합니다.**
   - 인증 세션, 전역 설정, 프레임워크 진입점 수준의 부트스트랩
   - 이 경우에도 도메인 데이터 조회와 섞지 않습니다.

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
│       ├── api/          # User DB/API access
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

4.  **도메인 데이터 접근 위임**
    - 상위 레이어가 특정 도메인 DB 조회가 필요하면, 해당 도메인의 `entities/*/api` 또는 해당 사용자 행위의 `features/*/api`로 위임해야 합니다.
    - Bad: `widgets/app-header/api/get-app-header-data.ts`에서 `prisma.userProfile` 직접 조회
    - Good: `widgets/app-header/api/get-app-header-data.ts`에서 `entities/user/api/get-user-profile.ts` 호출

---

## 6. 일반적인 고민과 해결 (FAQ)

**Q. 기능인지 엔티티인지 헷갈립니다.**

- **Entity**: "무엇인가? (Model)"에 집중. 데이터와 데이터를 보여주는 단순 UI (예: `UserCard`). 사용자 인터랙션 로직(버튼 클릭 시 API 호출 등)을 거의 포함하지 않음.
- **Feature**: "무엇을 하는가? (Action)"에 집중. 사용자 시나리오이자 비즈니스 가치 (예: `UpdateProfile`). Entity를 import하여 조작함.

**Q. 같은 레이어의 슬라이스끼리 데이터를 공유해야 한다면?**

- 데이터를 필요로 하는 상위 레이어(Widget 또는 Page)에서 데이터를 조합하여 하위로 내려주거나 컴포지션 패턴을 사용합니다.
- 또는, 공통 로직을 하위 레이어(`shared` 등)로 내리거나 리팩토링을 고려합니다.

**Q. Widget이나 View에서 바로 DB를 조회해도 되나요?**

- 원칙적으로 안 됩니다. 특히 `prisma.<domain model>` 같은 도메인 쿼리는 `widgets/`, `views/`, `app/`가 직접 소유하면 안 됩니다.
- 상위 레이어는 하위 레이어의 API를 호출해 결과를 조합하는 역할만 합니다.
- 예외는 인증 세션, 전역 설정 같은 앱 부트스트랩 성격의 전역 인프라뿐입니다.
- 판단 기준이 애매하면 먼저 "이 쿼리가 특정 도메인 모델의 책임인가?"를 보고, 그렇다면 해당 `entities/*/api` 또는 `features/*/api`로 내립니다.

**Q. TypeScript 타입은 어디에 두어야 하나요?**

세그먼트 이름으로 `types`를 사용하는 것은 FSD 안티패턴입니다. 타입은 그 목적에 맞는 세그먼트 안에 배치합니다.

| 타입 종류 | 배치 위치 |
|----------|----------|
| 도메인 데이터 모델 타입 (`FavoriteItem`, `User` 등) | `model/types.ts` 또는 사용하는 훅/스토어 파일 내부 |
| Props 타입, Context 타입 | 해당 컴포넌트 파일 내부 (`ui/` 세그먼트) |
| API 응답 타입 | `api/` 세그먼트 내부 |
| 전역 공용 타입 | `shared/`의 목적 기반 세그먼트 (`shared/config` 등) |

`model/types.ts`처럼 **기존 세그먼트 내부 파일**로 `types.ts`를 두는 것은 허용됩니다. 금지되는 것은 슬라이스 레벨에 `types/`를 **별도 세그먼트**로 만드는 것입니다.

```
# ❌ 금지: types를 슬라이스 레벨 세그먼트로 사용
features/favorites/
├── model/
├── ui/
└── types/        ← 별도 세그먼트

# ✅ 허용: model 세그먼트 내부 파일로 배치
features/favorites/
├── model/
│   ├── use-favorites.ts
│   └── types.ts  ← model 세그먼트 내부 파일
└── ui/
```
