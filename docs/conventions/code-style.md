# 코드 스타일 (Frontend)

이 문서는 **2026-01-30 기준** 프론트엔드에서 널리 쓰이는  
TypeScript + React(Next.js) 관행을 기준으로 작성합니다.

---

## 적용 범위

- React 컴포넌트/훅
- 비동기 로직과 데이터 패칭
- 렌더링/상태 관리
- 성능에 영향을 주는 코드 스타일

---

## 기본 원칙

- **포맷은 도구에 위임**: Prettier/ESLint 결과를 최종 규칙으로 간주
- **const 우선**: 재할당이 필요할 때만 `let`
- **조기 반환**: 깊은 중첩을 피하고 가독성 향상
- **작은 함수**: 한 함수/컴포넌트는 하나의 책임만
- **명확한 의도**: 읽자마자 역할이 이해되는 이름 사용

---

## 조건부 로직 규칙 (AI 작성 포함)

AI를 활용해 작성한 코드도 아래 규칙을 **우선 적용**한다.

### 1) 중첩 깊이 제한

- `if/else` 중첩은 **최대 2단계**
- 3단계 이상이면 **조기 반환** 또는 **함수 분리**로 평탄화

### 2) 긴 else-if 체인 금지

- 분기 3개 이상이면 **lookup map/전략 함수**로 전환
- 열거형/문자열 분기는 `Record` 매핑 우선

### 3) 삼항 연산자 제한

- **JSX 내 삼항 연산자 전면 금지** (조건부 렌더링, className, style 값 모두 포함)
- 단순 boolean 분기는 `&&` 사용
- 조건부 className은 `cn()` + `&&` 사용
- 조건부 style 값은 return 전에 변수로 추출
- 비 JSX 코드에서 중첩 삼항은 금지, **명명된 변수/함수**로 분리

### 4) 조건식에서 부수효과 금지

- 조건식 내부에서 상태 변경/IO 수행 금지
- 조건 계산과 실행 로직을 분리

### 5) 의도 드러내기

- 복잡한 조건은 `isEligible`, `shouldShow` 같은 함수로 추출
- 조건식에 의미가 드러나지 않으면 **읽기 비용이 급증**한다

### 예시

```ts
// ❌ 깊은 중첩
if (user) {
  if (user.profile) {
    if (user.profile.active) {
      enableFeature()
    }
  }
}

// ✅ 조기 반환
if (!user?.profile?.active) return
enableFeature()
```

```ts
// ❌ 긴 else-if 체인
if (status === "idle") return "대기"
if (status === "loading") return "로딩"
if (status === "success") return "완료"

// ✅ 매핑 기반 분기
const labelByStatus: Record<Status, string> = {
  idle: "대기",
  loading: "로딩",
  success: "완료",
}
return labelByStatus[status]
```

```ts
// ❌ 중첩 삼항
const label = isAdmin ? (isActive ? "관리자" : "휴면") : "사용자"

// ✅ 함수 분리
const label = getUserLabel({ isAdmin, isActive })

function getUserLabel({
  isAdmin,
  isActive,
}: {
  isAdmin: boolean
  isActive: boolean
}) {
  if (!isAdmin) return "사용자"
  if (!isActive) return "휴면"
  return "관리자"
}
```

---

## React 렌더링 규칙

### 1) 파생 상태는 렌더링 중 계산

`props`/`state`로 계산 가능한 값은 **상태로 저장하지 않음**.  
불필요한 `useEffect`와 중복 상태를 피한다.

```tsx
// ❌ effect로 파생 상태 업데이트
const [fullName, setFullName] = useState("")
useEffect(() => {
  setFullName(firstName + " " + lastName)
}, [firstName, lastName])

// ✅ 렌더링 중 계산
const fullName = firstName + " " + lastName
```

### 2) JSX 내 삼항 연산자 전면 금지

조건부 렌더링, className, style 값 모두 삼항 금지. 아래 패턴을 사용한다.

```tsx
import { cn } from "@/lib/utils";

// ── 조건부 렌더링 ──────────────────────────────────────
// ❌ FORBIDDEN
{!diagnosisCompleted ? <DiagnosisButton /> : <StudyButton />}

// ✅ 단순 boolean → &&
{!diagnosisCompleted && <DiagnosisButton onClick={onDiagnosisClick} />}
{diagnosisCompleted && <StudyButton onClick={onQuizClick} />}

// ✅ 복잡한 분기 → 컴포넌트 추출 + early return
function HeroCta({ diagnosisCompleted, ... }: Props) {
  if (!diagnosisCompleted) return <DiagnosisButton />;
  return <StudyButton />;
}

// ⚠️ 숫자/nullable → 명시적 불리언 변환 필수
{count > 0 && <Badge count={count} />}  // ✅
{count && <Badge count={count} />}       // ❌ 0이면 "0" 렌더링

// ── 조건부 className ───────────────────────────────────
// ❌ FORBIDDEN
<div className={mounted ? "opacity-100" : "opacity-0"} />

// ✅ cn() + &&
<div className={cn("base", mounted && "opacity-100")} />

// ── 조건부 style 값 ────────────────────────────────────
// ❌ FORBIDDEN
<div style={{ animation: mounted ? "fadeIn 0.6s forwards" : "none" }} />

// ✅ return 전에 변수 추출
const animation = mounted ? "fadeIn 0.6s forwards" : "none";
<div style={{ animation }} />
```

### 3) 렌더링하지 않을 때는 `null`

빈 문자열/숫자 대신 `null`을 반환해 의도를 명확히 한다.

---

## 상태 업데이트 규칙

### 이전 상태를 기반으로 할 때는 함수형 업데이트

스테일 클로저와 불필요한 의존성 재생성을 방지한다.

```tsx
// ❌ 이전 상태에 의존
setItems([...items, newItem])

// ✅ 함수형 업데이트
setItems(curr => [...curr, newItem])
```

---

## useRef 사용 기준

자주 변하지만 UI에 직접 반영되지 않는 값은 `useRef`에 보관한다.  
예: 마우스 좌표, 타이머 플래그, 마지막 스크롤 위치 등.

```tsx
const latestXRef = useRef(0)
latestXRef.current = e.clientX // 렌더링 없음
```

---

## 비동기/데이터 패칭

### 1) 독립 작업은 병렬 실행

```ts
// ✅ 병렬 처리
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()])
```

### 2) 부분 의존성도 가능한 만큼 병렬화

```ts
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))
const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise,
])
```

---

## Suspense 경계 사용

레이아웃 전체를 기다리게 하지 말고 **데이터가 필요한 구간만** 대기.  
초기 렌더가 빨라지고 UX가 개선된다.

```tsx
<Suspense fallback={<Skeleton />}>
  <DataSection />
</Suspense>
```

---

## 번들/로딩 최적화

무거운 컴포넌트는 동적 로딩(`next/dynamic`)으로 분리한다.

```tsx
const MonacoEditor = dynamic(
  () => import("./monaco-editor").then(m => m.MonacoEditor),
  { ssr: false }
)
```

---

## 예외 규칙

- 성능/접근성/보안 이유로 규칙을 벗어날 수 있음
- **예외는 반드시 근거와 함께 문서화**

