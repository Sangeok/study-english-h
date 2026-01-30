# Phase 1-2: AI 레벨 진단 및 기본 퀴즈 시스템

## 📋 문서 정보
- **Phase**: 1-2
- **기간**: 1.5-2주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-1 (인증 시스템 - Better Auth + 카카오 로그인 완료)
- **목표**: 사용자 레벨 진단 및 한글→영어 퀴즈 학습 기능 구현

---

## 🎯 Phase 목표

### 핵심 목표
- ✅ 20문제 AI 레벨 진단 시스템
- ✅ CEFR 레벨 매핑 (A1~C2)
- ✅ 한글→영어 퀴즈 학습 (초기 500문제)
- ✅ 퀴즈 제출 및 피드백 시스템
- ✅ 약점 영역 분석

---

## ⚠️ 기술 스택 전제 조건

### 현재 프로젝트 환경 (Phase 1-1 완료 상태)
| 항목 | 기술 | 비고 |
|------|------|------|
| **인증** | Better Auth v1.4 | NextAuth 아님 |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` | Prisma 5 아님 |
| **Prisma Client 경로** | `@/lib/generated/prisma` | 커스텀 output |
| **DB Import** | `import prisma from "@/lib/db"` | default export |
| **DB** | PostgreSQL (Neon) | 클라우드 |
| **프레임워크** | Next.js 16, React 19 | App Router |
| **아키텍처** | Feature-Sliced Design (FSD) | 계층 구조 적용 |
| **CSS** | Tailwind CSS 4 | PostCSS 사용 |

---

## 🏗️ 구현 단계

### Step 0: 필수 패키지 설치 (사전 작업)

```bash
# Zod (스키마 유효성 검증)
npm install zod
```

> `react-hook-form`, `zustand` 등은 Phase 1-2에서 반드시 필요하지 않으므로 필요 시 추후 설치한다.

---

### Step 1: 데이터베이스 스키마 확장 (1일차)

#### 1.1 Prisma Schema 추가
`prisma/schema.prisma`에 기존 모델(User, Account, Session, Verification) 유지하면서 추가:

```prisma
// ─── 사용자 프로필 (User 모델에 1:1 관계 추가) ───

model UserProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  level           String    @default("A1")    // CEFR 레벨
  totalXP         Int       @default(0)
  lastStudyDate   DateTime?

  // 약점 영역 (JSON): {"동사": 45.5, "형용사": 30.0}
  weaknessAreas   Json?

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
}

// ─── 레벨 진단 ───

model LevelDiagnosis {
  id              String    @id @default(cuid())
  userId          String
  totalScore      Int       // 0-100
  cefrLevel       String    // A1, A2, B1, B2, C1, C2
  completedAt     DateTime  @default(now())

  weaknessAreas   WeaknessArea[]
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model WeaknessArea {
  id              String   @id @default(cuid())
  diagnosisId     String
  category        String   // 동사, 형용사, 명사 등
  accuracy        Float    // 정확도 %

  diagnosis       LevelDiagnosis @relation(fields: [diagnosisId], references: [id], onDelete: Cascade)

  @@index([diagnosisId])
}

// ─── 퀴즈 콘텐츠 ───

model QuizQuestion {
  id              String   @id @default(cuid())
  koreanHint      String   // 한글 힌트
  englishWord     String   // 정답 영어 단어
  sentence        String   // 문맥 문장 (빈칸 포함)
  difficulty      String   // A1, A2, B1, B2, C1, C2
  category        String   // daily, business, toeic, travel, idioms

  options         QuizOption[]
  attempts        UserQuizAttempt[]

  createdAt       DateTime @default(now())

  @@index([difficulty, category])
}

model QuizOption {
  id              String   @id @default(cuid())
  questionId      String
  text            String
  isCorrect       Boolean
  order           Int      // 1-4

  question        QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
}

// ─── 사용자 퀴즈 시도 ───

model UserQuizAttempt {
  id              String   @id @default(cuid())
  userId          String
  questionId      String
  selectedAnswer  String
  isCorrect       Boolean
  timeSpent       Int      // 초 단위
  attemptedAt     DateTime @default(now())

  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  question        QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([userId, attemptedAt])
}
```

#### 1.2 User 모델에 관계 추가
기존 `User` 모델에 아래 관계 필드를 추가:
```prisma
model User {
  // ... 기존 필드들 (id, name, email, emailVerified, image 등)

  accounts        Account[]
  sessions        Session[]

  // Phase 1-2 추가
  profile         UserProfile?
  diagnoses       LevelDiagnosis[]
  quizAttempts    UserQuizAttempt[]
}
```

#### 1.3 마이그레이션
```bash
npx prisma migrate dev --name add_quiz_diagnosis
npx prisma generate
```

---

### Step 2: 세션 인증 헬퍼 구현 (1일차)

Better Auth는 NextAuth와 달리 `auth()` 호출로 세션을 가져올 수 없다.
API Route에서 세션을 확인하려면 `auth.api.getSession()`을 사용해야 한다.

#### 2.1 서버 세션 헬퍼
`shared/lib/get-session.ts`:
```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * API Route / Server Component에서 현재 세션을 가져온다.
 * Better Auth의 auth.api.getSession()을 래핑한 헬퍼.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session
}

/**
 * Request 객체에서 세션을 가져온다. (API Route 전용)
 */
export async function getSessionFromRequest(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  return session
}
```

---

### Step 3: FSD 디렉토리 구조 설계

Phase 1-2에서 생성할 FSD 기반 디렉토리:

```
study-eng-h/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts       # 기존
│   │   ├── diagnosis/
│   │   │   ├── start/route.ts           # 진단 시작
│   │   │   ├── submit/route.ts          # 진단 제출
│   │   │   └── [id]/route.ts            # 진단 결과 조회
│   │   └── quiz/
│   │       ├── daily/route.ts           # 일일 퀴즈 생성
│   │       └── submit/route.ts          # 퀴즈 제출
│   ├── diagnosis/
│   │   ├── page.tsx                     # 진단 페이지 (라우팅)
│   │   └── result/page.tsx              # 진단 결과 페이지 (라우팅)
│   └── quiz/
│       └── page.tsx                     # 퀴즈 페이지 (라우팅)
│
├── features/
│   ├── diagnosis/                       # 레벨 진단 Feature
│   │   ├── ui/
│   │   │   ├── DiagnosisTest.tsx        # 진단 테스트 UI
│   │   │   └── DiagnosisResult.tsx      # 진단 결과 UI
│   │   ├── model/
│   │   │   └── use-diagnosis.ts         # 진단 상태 관리 hook
│   │   ├── lib/
│   │   │   ├── scoring.ts              # 점수 계산 알고리즘
│   │   │   └── question-generator.ts   # 문제 생성 로직
│   │   └── index.ts                     # Public API
│   └── quiz/                            # 퀴즈 Feature
│       ├── ui/
│       │   ├── QuizContainer.tsx        # 퀴즈 컨테이너
│       │   ├── QuizQuestion.tsx         # 문제 표시
│       │   ├── AnswerOptions.tsx        # 선택지
│       │   └── QuizFeedback.tsx         # 피드백 표시
│       ├── model/
│       │   └── use-quiz.ts             # 퀴즈 상태 관리 hook
│       └── index.ts                     # Public API
│
├── entities/
│   └── user/
│       ├── model/
│       │   └── types.ts                 # User 관련 타입 정의
│       └── index.ts
│
├── shared/
│   ├── lib/
│   │   ├── get-session.ts              # Better Auth 세션 헬퍼
│   │   └── utils.ts                    # shuffleArray 등 유틸
│   └── ui/
│       └── ProgressBar.tsx             # 공유 프로그레스바
│
├── lib/
│   ├── auth.ts                          # 기존 Better Auth 설정
│   ├── auth-client.ts                   # 기존 Better Auth 클라이언트
│   ├── db.ts                            # 기존 Prisma Client
│   └── generated/prisma/               # 기존 Prisma 생성 코드
│
└── prisma/
    ├── schema.prisma
    └── seed-quiz.ts                     # 퀴즈 시드 데이터
```

---

### Step 4: 레벨 진단 알고리즘 구현 (2-3일차)

#### 4.1 공유 유틸리티
`shared/lib/utils.ts`:
```typescript
/**
 * 배열을 무작위로 섞는다 (Fisher-Yates shuffle).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

#### 4.2 진단 문제 생성 로직
`features/diagnosis/lib/question-generator.ts`:
```typescript
import prisma from "@/lib/db"
import { shuffleArray } from "@/shared/lib/utils"

export interface DiagnosisQuestion {
  id: string
  koreanHint: string
  englishWord: string
  sentence: string
  difficulty: string
  category: string
  options: {
    text: string
    isCorrect: boolean
  }[]
}

/**
 * 레벨 진단용 20문제 생성
 * 난이도 분포: A1(6) + A2(5) + B1(4) + B2(3) + C1(2) = 20문제
 */
export async function generateDiagnosisQuestions(): Promise<DiagnosisQuestion[]> {
  const distribution = [
    { level: "A1", count: 6 },
    { level: "A2", count: 5 },
    { level: "B1", count: 4 },
    { level: "B2", count: 3 },
    { level: "C1", count: 2 },
  ]

  const questions: DiagnosisQuestion[] = []

  for (const { level, count } of distribution) {
    const levelQuestions = await prisma.quizQuestion.findMany({
      where: { difficulty: level },
      include: {
        options: { orderBy: { order: "asc" } },
      },
      take: count * 2, // 풀을 넉넉히 가져와서 랜덤 선택
      orderBy: { createdAt: "desc" },
    })

    const selected = shuffleArray(levelQuestions).slice(0, count)

    questions.push(
      ...selected.map((q) => ({
        id: q.id,
        koreanHint: q.koreanHint,
        englishWord: q.englishWord,
        sentence: q.sentence,
        difficulty: q.difficulty,
        category: q.category,
        options: q.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      }))
    )
  }

  return shuffleArray(questions)
}
```

#### 4.3 점수 계산 및 CEFR 매핑
`features/diagnosis/lib/scoring.ts`:
```typescript
export interface DiagnosisAnswer {
  questionId: string
  difficulty: string
  isCorrect: boolean
  category: string
}

export interface DiagnosisResult {
  totalScore: number
  cefrLevel: string
  weaknessAreas: {
    category: string
    accuracy: number
  }[]
  recommendedStartPoint: string
}

const DIFFICULTY_WEIGHTS: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

/**
 * 레벨 진단 점수 계산
 */
export function calculateDiagnosisScore(
  answers: DiagnosisAnswer[]
): DiagnosisResult {
  // 1. 난이도별 가중치 점수 계산
  let totalWeightedScore = 0
  let maxPossibleScore = 0

  for (const answer of answers) {
    const weight = DIFFICULTY_WEIGHTS[answer.difficulty] ?? 1
    maxPossibleScore += weight
    if (answer.isCorrect) {
      totalWeightedScore += weight
    }
  }

  const totalScore =
    maxPossibleScore > 0
      ? Math.round((totalWeightedScore / maxPossibleScore) * 100)
      : 0

  // 2. CEFR 레벨 매핑
  const cefrLevel = mapScoreToCEFR(totalScore)

  // 3. 약점 영역 분석
  const weaknessAreas = analyzeWeaknesses(answers)

  // 4. 추천 시작 레벨
  const recommendedStartPoint = getRecommendedLevel(cefrLevel, weaknessAreas)

  return { totalScore, cefrLevel, weaknessAreas, recommendedStartPoint }
}

function mapScoreToCEFR(score: number): string {
  if (score >= 96) return "C2"
  if (score >= 81) return "C1"
  if (score >= 61) return "B2"
  if (score >= 41) return "B1"
  if (score >= 21) return "A2"
  return "A1"
}

/**
 * 약점 영역 분석 (정확도 < 60%)
 */
function analyzeWeaknesses(
  answers: DiagnosisAnswer[]
): { category: string; accuracy: number }[] {
  const stats: Record<string, { correct: number; total: number }> = {}

  for (const answer of answers) {
    if (!stats[answer.category]) {
      stats[answer.category] = { correct: 0, total: 0 }
    }
    stats[answer.category].total++
    if (answer.isCorrect) {
      stats[answer.category].correct++
    }
  }

  return Object.entries(stats)
    .map(([category, { correct, total }]) => ({
      category,
      accuracy: (correct / total) * 100,
    }))
    .filter((item) => item.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
}

function getRecommendedLevel(
  cefrLevel: string,
  weaknessAreas: { category: string; accuracy: number }[]
): string {
  if (weaknessAreas.length >= 3) {
    const currentIndex = CEFR_LEVELS.indexOf(cefrLevel)
    return currentIndex > 0 ? CEFR_LEVELS[currentIndex - 1] : cefrLevel
  }
  return cefrLevel
}
```

---

### Step 5: 레벨 진단 API 구현 (3-4일차)

#### 5.1 진단 시작 API
`app/api/diagnosis/start/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSessionFromRequest } from "@/shared/lib/get-session"
import { generateDiagnosisQuestions } from "@/features/diagnosis/lib/question-generator"

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const questions = await generateDiagnosisQuestions()

    return NextResponse.json({
      questions,
      totalQuestions: questions.length,
      timeLimit: 300,
    })
  } catch (error) {
    console.error("Diagnosis start error:", error)
    return NextResponse.json(
      { error: "진단 문제 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

#### 5.2 진단 제출 API
`app/api/diagnosis/submit/route.ts`:
```typescript
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSessionFromRequest } from "@/shared/lib/get-session"
import {
  calculateDiagnosisScore,
  type DiagnosisAnswer,
} from "@/features/diagnosis/lib/scoring"

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { answers } = (await req.json()) as { answers: DiagnosisAnswer[] }
    const userId = session.user.id

    // 점수 계산
    const result = calculateDiagnosisScore(answers)

    // 진단 결과 저장
    const diagnosis = await prisma.levelDiagnosis.create({
      data: {
        userId,
        totalScore: result.totalScore,
        cefrLevel: result.cefrLevel,
        weaknessAreas: {
          create: result.weaknessAreas.map((area) => ({
            category: area.category,
            accuracy: area.accuracy,
          })),
        },
      },
      include: {
        weaknessAreas: true,
      },
    })

    // UserProfile upsert (없으면 생성, 있으면 업데이트)
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        level: result.cefrLevel,
        weaknessAreas: result.weaknessAreas.reduce(
          (acc, area) => {
            acc[area.category] = area.accuracy
            return acc
          },
          {} as Record<string, number>
        ),
      },
      update: {
        level: result.cefrLevel,
        weaknessAreas: result.weaknessAreas.reduce(
          (acc, area) => {
            acc[area.category] = area.accuracy
            return acc
          },
          {} as Record<string, number>
        ),
      },
    })

    return NextResponse.json({
      diagnosisId: diagnosis.id,
      totalScore: result.totalScore,
      cefrLevel: result.cefrLevel,
      weaknessAreas: result.weaknessAreas,
      recommendedStartPoint: result.recommendedStartPoint,
    })
  } catch (error) {
    console.error("Diagnosis submit error:", error)
    return NextResponse.json(
      { error: "진단 제출 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

#### 5.3 진단 결과 조회 API
`app/api/diagnosis/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSessionFromRequest } from "@/shared/lib/get-session"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { id } = await params

    const diagnosis = await prisma.levelDiagnosis.findUnique({
      where: { id },
      include: { weaknessAreas: true },
    })

    if (!diagnosis || diagnosis.userId !== session.user.id) {
      return NextResponse.json(
        { error: "진단 결과를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      totalScore: diagnosis.totalScore,
      cefrLevel: diagnosis.cefrLevel,
      weaknessAreas: diagnosis.weaknessAreas.map((wa) => ({
        category: wa.category,
        accuracy: wa.accuracy,
      })),
      completedAt: diagnosis.completedAt,
    })
  } catch (error) {
    console.error("Diagnosis fetch error:", error)
    return NextResponse.json(
      { error: "진단 결과 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

---

### Step 6: 퀴즈 시스템 API 구현 (4-6일차)

#### 6.1 맞춤형 퀴즈 생성 API
`app/api/quiz/daily/route.ts`:
```typescript
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSessionFromRequest } from "@/shared/lib/get-session"
import { shuffleArray } from "@/shared/lib/utils"

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const count = parseInt(searchParams.get("count") || "10")

    // 사용자 프로필 조회
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    // 프로필이 없으면 기본 A1 레벨로 문제 생성
    const userLevel = profile?.level ?? "A1"

    // 약점 영역 기반 문제 선택 (50% 약점, 50% 일반)
    const weaknessCategories = profile?.weaknessAreas
      ? Object.keys(profile.weaknessAreas as Record<string, number>)
      : []

    const weaknessCount =
      weaknessCategories.length > 0 ? Math.floor(count * 0.5) : 0
    const normalCount = count - weaknessCount

    let questions = []

    // 약점 영역 문제
    if (weaknessCount > 0) {
      const weaknessQuestions = await prisma.quizQuestion.findMany({
        where: {
          difficulty: userLevel,
          category: { in: weaknessCategories },
        },
        include: {
          options: { orderBy: { order: "asc" } },
        },
        take: weaknessCount * 2,
      })
      questions.push(...shuffleArray(weaknessQuestions).slice(0, weaknessCount))
    }

    // 일반 문제
    const normalQuestions = await prisma.quizQuestion.findMany({
      where: {
        difficulty: userLevel,
        ...(weaknessCategories.length > 0 && {
          category: { notIn: weaknessCategories },
        }),
      },
      include: {
        options: { orderBy: { order: "asc" } },
      },
      take: normalCount * 2,
    })
    questions.push(...shuffleArray(normalQuestions).slice(0, normalCount))

    questions = shuffleArray(questions)

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        koreanHint: q.koreanHint,
        sentence: q.sentence,
        difficulty: q.difficulty,
        category: q.category,
        options: q.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      })),
      userLevel,
      totalQuestions: questions.length,
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json(
      { error: "퀴즈 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

#### 6.2 퀴즈 제출 API
`app/api/quiz/submit/route.ts`:
```typescript
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSessionFromRequest } from "@/shared/lib/get-session"

interface QuizSubmission {
  questionId: string
  selectedAnswer: string
  timeSpent: number
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { answers } = (await req.json()) as { answers: QuizSubmission[] }

    // 각 문제의 정답 확인
    const results = await Promise.all(
      answers.map(async (answer) => {
        const question = await prisma.quizQuestion.findUnique({
          where: { id: answer.questionId },
          include: { options: true },
        })

        if (!question) return null

        const correctOption = question.options.find((opt) => opt.isCorrect)
        const isCorrect = correctOption?.text === answer.selectedAnswer

        // 시도 기록 저장
        await prisma.userQuizAttempt.create({
          data: {
            userId,
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
            isCorrect,
            timeSpent: answer.timeSpent,
          },
        })

        return {
          questionId: answer.questionId,
          isCorrect,
          correctAnswer: correctOption?.text,
          explanation: question.sentence,
        }
      })
    )

    const validResults = results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    )
    const correctCount = validResults.filter((r) => r.isCorrect).length
    const accuracy =
      validResults.length > 0 ? (correctCount / validResults.length) * 100 : 0
    const xpEarned = correctCount * 10

    // UserProfile upsert (XP 적립 및 학습일 업데이트)
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        totalXP: xpEarned,
        lastStudyDate: new Date(),
      },
      update: {
        totalXP: { increment: xpEarned },
        lastStudyDate: new Date(),
      },
    })

    return NextResponse.json({
      results: validResults,
      summary: {
        total: validResults.length,
        correct: correctCount,
        accuracy: Math.round(accuracy),
        xpEarned,
      },
    })
  } catch (error) {
    console.error("Quiz submit error:", error)
    return NextResponse.json(
      { error: "퀴즈 제출 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

---

### Step 7: 프론트엔드 UI 구현 (6-10일차)

#### 7.1 레벨 진단 Feature UI
`features/diagnosis/ui/DiagnosisTest.tsx`:
```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface DiagnosisQuestion {
  id: string
  koreanHint: string
  sentence: string
  difficulty: string
  category: string
  options: { text: string; isCorrect: boolean }[]
}

export function DiagnosisTest() {
  const router = useRouter()
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(300)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/diagnosis/start")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions)
        setIsLoading(false)
      })
      .catch(console.error)
  }, [])

  const handleSubmit = useCallback(async () => {
    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      difficulty: q.difficulty,
      isCorrect: q.options.find((opt) => opt.isCorrect)?.text === answers[q.id],
      category: q.category,
    }))

    const response = await fetch("/api/diagnosis/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: formattedAnswers }),
    })

    const result = await response.json()
    router.push(`/diagnosis/result?id=${result.diagnosisId}`)
  }, [questions, answers, router])

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, handleSubmit])

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            진단 문제를 준비하고 있습니다...
          </p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">진단 문제를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">레벨 진단 테스트</h1>
            <div className="text-lg font-semibold text-blue-600">
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                {currentIndex + 1} / {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 문제 */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              {currentQuestion.difficulty}
            </div>
            <h2 className="text-3xl font-bold text-center mb-8">
              {currentQuestion.koreanHint}
            </h2>
            <p className="text-lg text-gray-700 text-center mb-8">
              {currentQuestion.sentence}
            </p>
          </div>

          {/* 선택지 */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion.id, option.text)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  answers[currentQuestion.id] === option.text
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[currentQuestion.id] === option.text
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion.id] === option.text && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-lg">{option.text}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                제출하기
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                다음
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 7.2 진단 결과 Feature UI
`features/diagnosis/ui/DiagnosisResult.tsx`:
```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DiagnosisResultData {
  totalScore: number
  cefrLevel: string
  weaknessAreas: { category: string; accuracy: number }[]
  completedAt: string
}

interface DiagnosisResultProps {
  diagnosisId: string
}

export function DiagnosisResult({ diagnosisId }: DiagnosisResultProps) {
  const router = useRouter()
  const [result, setResult] = useState<DiagnosisResultData | null>(null)

  useEffect(() => {
    if (diagnosisId) {
      fetch(`/api/diagnosis/${diagnosisId}`)
        .then((res) => res.json())
        .then(setResult)
        .catch(console.error)
    }
  }, [diagnosisId])

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">진단 완료!</h1>
            <p className="text-gray-600">당신의 영어 레벨을 분석했습니다</p>
          </div>

          {/* 레벨 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center mb-8">
            <div className="text-sm uppercase tracking-wide mb-2">
              Your Level
            </div>
            <div className="text-6xl font-bold mb-2">{result.cefrLevel}</div>
            <div className="text-xl">총점: {result.totalScore}/100</div>
          </div>

          {/* 약점 영역 */}
          {result.weaknessAreas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                집중 학습이 필요한 영역
              </h2>
              <div className="space-y-3">
                {result.weaknessAreas.map((area, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{area.category}</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(area.accuracy)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${area.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            학습 시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 7.3 Feature Public API
`features/diagnosis/index.ts`:
```typescript
export { DiagnosisTest } from "./ui/DiagnosisTest"
export { DiagnosisResult } from "./ui/DiagnosisResult"
```

#### 7.4 페이지 라우트 (App Router)
`app/diagnosis/page.tsx`:
```typescript
import { DiagnosisTest } from "@/features/diagnosis"

export default function DiagnosisPage() {
  return <DiagnosisTest />
}
```

`app/diagnosis/result/page.tsx`:
```typescript
"use client"

import { useSearchParams } from "next/navigation"
import { DiagnosisResult } from "@/features/diagnosis"

export default function DiagnosisResultPage() {
  const searchParams = useSearchParams()
  const diagnosisId = searchParams.get("id")

  if (!diagnosisId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">진단 결과를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return <DiagnosisResult diagnosisId={diagnosisId} />
}
```

---

## ✅ 완료 체크리스트

### 사전 작업
- [ ] `zod` 패키지 설치
- [ ] `shared/lib/` 디렉토리 생성

### 데이터베이스
- [ ] Schema 확장 (UserProfile, LevelDiagnosis, WeaknessArea, QuizQuestion, QuizOption, UserQuizAttempt)
- [ ] User 모델에 관계 추가
- [ ] 마이그레이션 성공
- [ ] 초기 문제 데이터 입력 (500문제)

### 인증 연동
- [ ] `shared/lib/get-session.ts` 헬퍼 구현 (Better Auth 기반)

### 레벨 진단
- [ ] `features/diagnosis/lib/question-generator.ts` 구현
- [ ] `features/diagnosis/lib/scoring.ts` 구현
- [ ] `app/api/diagnosis/start/route.ts` 구현
- [ ] `app/api/diagnosis/submit/route.ts` 구현
- [ ] `app/api/diagnosis/[id]/route.ts` 구현
- [ ] `features/diagnosis/ui/DiagnosisTest.tsx` 구현
- [ ] `features/diagnosis/ui/DiagnosisResult.tsx` 구현
- [ ] `app/diagnosis/page.tsx` 라우트 설정
- [ ] `app/diagnosis/result/page.tsx` 라우트 설정

### 퀴즈 시스템
- [ ] `app/api/quiz/daily/route.ts` 구현
- [ ] `app/api/quiz/submit/route.ts` 구현
- [ ] 퀴즈 UI 구현 (features/quiz/)

---

## 🧪 테스트 시나리오

### 레벨 진단
1. 20문제 정상 생성 (난이도 분포 확인)
2. 타이머 작동 (5분)
3. 점수 계산 정확성 (가중치 반영)
4. CEFR 레벨 매핑 정확성
5. 약점 영역 분석 (정확도 < 60% 필터링)
6. UserProfile upsert 정상 동작

### 퀴즈 학습
1. 레벨별 문제 출제 확인
2. 약점 영역 우선 출제 (50% 비율)
3. 정답 확인 및 XP 적립
4. 프로필 없는 신규 유저 처리

### 인증
1. Better Auth 세션 정상 확인
2. 미인증 시 401 응답

---

## 📚 초기 데이터 준비

### Seed 스크립트
`prisma/seed-quiz.ts`:
```typescript
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

const sampleQuestions = [
  {
    koreanHint: "사과",
    englishWord: "apple",
    sentence: "I ate an _____ for breakfast.",
    difficulty: "A1",
    category: "daily",
    options: [
      { text: "apple", isCorrect: true, order: 1 },
      { text: "orange", isCorrect: false, order: 2 },
      { text: "banana", isCorrect: false, order: 3 },
      { text: "grape", isCorrect: false, order: 4 },
    ],
  },
  {
    koreanHint: "물",
    englishWord: "water",
    sentence: "Can I have some _____?",
    difficulty: "A1",
    category: "daily",
    options: [
      { text: "water", isCorrect: true, order: 1 },
      { text: "fire", isCorrect: false, order: 2 },
      { text: "earth", isCorrect: false, order: 3 },
      { text: "wind", isCorrect: false, order: 4 },
    ],
  },
  // ... 500개의 문제 데이터 (별도 JSON 파일 관리 권장)
]

async function main() {
  console.log("Starting quiz data seed...")

  for (const q of sampleQuestions) {
    await prisma.quizQuestion.create({
      data: {
        koreanHint: q.koreanHint,
        englishWord: q.englishWord,
        sentence: q.sentence,
        difficulty: q.difficulty,
        category: q.category,
        options: {
          create: q.options,
        },
      },
    })
  }

  console.log(`Seeded ${sampleQuestions.length} quiz questions successfully!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

실행:
```bash
npx tsx prisma/seed-quiz.ts
```

> **참고**: 프로젝트에 `tsx` 패키지가 설치되어 있다. `ts-node`는 사용하지 않는다.

---

## 📝 변경 이력

| 일자 | 변경 내용 |
|------|-----------|
| 2026-01-30 | 초안 작성 |
| 2026-01-30 | NextAuth → Better Auth 전환 반영 |
| 2026-01-30 | Prisma 7 + `@prisma/adapter-pg` 반영 |
| 2026-01-30 | FSD 아키텍처 구조 적용 |
| 2026-01-30 | Prisma import 방식 수정 (default export) |
| 2026-01-30 | 세션 헬퍼 `getSessionFromRequest()` 추가 |
| 2026-01-30 | Seed 스크립트 `tsx` 실행으로 변경 |
| 2026-01-30 | 진단 결과 조회 API (`/api/diagnosis/[id]`) 추가 |
| 2026-01-30 | `UserProfile` upsert 패턴 적용 (없으면 생성) |
| 2026-01-30 | Feature Public API (`index.ts`) 추가 |

---

## 🚀 다음 단계

Phase 1-2 완료 후:
- Phase 1-3: 어휘 학습 및 SRS 시스템
- 플래시카드 기능 구현
- Spaced Repetition 알고리즘 적용
