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

### 2) 조건부 렌더링은 명시적으로

조건 값이 `0`/`NaN` 가능성이 있으면 `&&` 대신 **삼항 연산자** 사용.

```tsx
// ❌ count가 0이면 "0"이 렌더링됨
{count && <Badge count={count} />}

// ✅ 명시적 렌더링
{count > 0 ? <Badge count={count} /> : null}
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

