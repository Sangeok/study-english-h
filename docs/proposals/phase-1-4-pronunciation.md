# Phase 1-4: 발음 진단 시스템

## 📋 문서 정보
- **Phase**: 1-4
- **기간**: 1-1.5주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-3 (어휘 학습)
- **목표**: Web Speech API 기반 발음 정밀 진단 및 피드백 시스템

---

## ⚠️ 기술 스택 전제 조건

### 현재 프로젝트 환경 (Phase 1-3 완료 상태)
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
| **세션 헬퍼** | `getSessionFromRequest(req)` | `shared/lib/get-session.ts` |

### 사전 요구사항

- Phase 1-2 완료: UserProfile 모델, 세션 헬퍼 (`getSessionFromRequest()`) 구현
- Phase 1-3 완료: 어휘 학습 시스템 (단어 데이터 활용)
- Better Auth 인증 시스템 정상 동작
- PostgreSQL (Neon Cloud) 데이터베이스 연결 정상

---

## 🎯 Phase 목표

### 핵심 목표
- [ ] Web Speech API 통합
- [ ] 음소별 정확도 분석
- [ ] 표 형식 결과 UI
- [ ] 발음 개선 피드백
- [ ] 텍스트 모드 지원

---

## 🏗️ 구현 단계

### Step 1: 데이터베이스 스키마 확장 (1일차)

#### 1.1 Prisma Schema 추가
`prisma/schema.prisma`에 추가:
```prisma
// 발음 진단 결과
model PronunciationAttempt {
  id              String   @id @default(cuid())
  userId          String
  word            String   // 진단한 단어
  targetWord      String   // 목표 발음
  recognizedText  String?  // 인식된 텍스트
  overallScore    Int      // 전체 점수 (0-100)

  // 음소별 분석 결과 (JSON)
  phonemeScores   Json?    // [{phoneme: 'æ', accuracy: 92}, ...]

  // 분석 결과
  feedback        String?  // 피드백 텍스트
  strengths       Json?    // 잘한 부분
  improvements    Json?    // 개선 필요 부분

  duration        Int      // 녹음 시간 (초)
  audioUrl        String?  // 녹음 파일 URL (옵션)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, createdAt])
  @@map("pronunciation_attempts")
}

// User 모델에 관계 추가 (Phase 1-1에서 생성됨, Phase 1-4 관계만 추가)
model User {
  // ... 기존 필드들 (Phase 1-1)

  // Phase 1-4 추가
  pronunciationAttempts PronunciationAttempt[]
}

// UserProfile 모델 확장 (Phase 1-2에서 생성됨, Phase 1-4 필드만 추가)
model UserProfile {
  // ... 기존 필드들 (Phase 1-2)

  // Phase 1-4 추가 필드
  pronunciationScore   Int      @default(0)   // 평균 발음 점수
  totalPronunciations  Int      @default(0)   // 총 발음 시도 횟수
}
```

#### 1.2 마이그레이션
```bash
npx prisma migrate dev --name add_pronunciation
npx prisma generate
```

---

### Step 2: 발음 분석 로직 구현 (2-3일차)

#### 2.1 발음 분석 유틸리티
`lib/pronunciation/analyzer.ts`:
```typescript
export interface PhonemeScore {
  phoneme: string
  accuracy: number
  severity: 'excellent' | 'good' | 'fair' | 'needs-improvement'
}

export interface PronunciationResult {
  overallScore: number
  phonemeScores: PhonemeScore[]
  feedback: string
  strengths: string[]
  improvements: string[]
}

/**
 * 발음 정확도 계산 (기본 버전 - Web Speech API)
 */
export function analyzePronunciation(
  targetWord: string,
  recognizedText: string
): PronunciationResult {
  const normalizedTarget = normalizeText(targetWord)
  const normalizedRecognized = normalizeText(recognizedText)

  // 1. 전체 정확도 계산 (Levenshtein Distance 기반)
  const similarity = calculateSimilarity(normalizedTarget, normalizedRecognized)
  const overallScore = Math.round(similarity * 100)

  // 2. 음소별 분석 (간단한 버전)
  const phonemeScores = analyzePhonemes(normalizedTarget, normalizedRecognized)

  // 3. 피드백 생성
  const { feedback, strengths, improvements } = generateFeedback(
    overallScore,
    phonemeScores
  )

  return {
    overallScore,
    phonemeScores,
    feedback,
    strengths,
    improvements,
  }
}

/**
 * 텍스트 정규화
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

/**
 * Levenshtein Distance 기반 유사도 계산
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * 음소별 분석 (기본 버전)
 */
function analyzePhonemes(target: string, recognized: string): PhonemeScore[] {
  const scores: PhonemeScore[] = []

  // 각 글자별 비교
  for (let i = 0; i < target.length; i++) {
    const targetChar = target[i]
    const recognizedChar = recognized[i] || ''

    const isMatch = targetChar === recognizedChar
    const accuracy = isMatch ? 100 : 0

    scores.push({
      phoneme: targetChar,
      accuracy,
      severity: getSeverity(accuracy),
    })
  }

  return scores
}

/**
 * ⚠️ 현재 구현의 한계:
 * - 글자 단위(character-level) 비교이며, 실제 IPA 음소(phoneme) 분석이 아님
 * - speakingRate, pausePattern 등 상위 계획서 명세는 Phase 1에서 미구현
 * - Phase 2에서 Google Cloud Speech-to-Text API를 활용한 고도화 예정
 *   (실제 음소 분석, 파형 비교, 억양 분석 등)
 */

function getSeverity(accuracy: number): PhonemeScore['severity'] {
  if (accuracy >= 90) return 'excellent'
  if (accuracy >= 70) return 'good'
  if (accuracy >= 50) return 'fair'
  return 'needs-improvement'
}

/**
 * 피드백 생성
 */
function generateFeedback(
  overallScore: number,
  phonemeScores: PhonemeScore[]
): {
  feedback: string
  strengths: string[]
  improvements: string[]
} {
  const strengths: string[] = []
  const improvements: string[] = []

  // 우수한 음소
  phonemeScores
    .filter(p => p.severity === 'excellent')
    .forEach(p => strengths.push(`'${p.phoneme}' 발음이 정확합니다`))

  // 개선 필요 음소
  phonemeScores
    .filter(p => p.severity === 'needs-improvement' || p.severity === 'fair')
    .forEach(p => improvements.push(`'${p.phoneme}' 발음에 더 집중하세요`))

  // 전체 피드백
  let feedback = ''
  if (overallScore >= 90) {
    feedback = '훌륭합니다! 발음이 매우 정확합니다.'
  } else if (overallScore >= 70) {
    feedback = '좋습니다! 조금만 더 연습하면 완벽해질 거예요.'
  } else if (overallScore >= 50) {
    feedback = '괜찮습니다. 계속 연습하면 발전할 수 있습니다.'
  } else {
    feedback = '더 연습이 필요합니다. 천천히 정확하게 발음해보세요.'
  }

  return {
    feedback,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}
```

---

### Step 2.5: Zod 검증 스키마 구현

#### 2.5.1 발음 검증 스키마
`lib/pronunciation/validation.ts`:
```typescript
import { z } from "zod"

/**
 * 발음 분석 요청 검증 스키마
 */
export const pronunciationAnalyzeSchema = z.object({
  targetWord: z.string().min(1, "단어를 입력해주세요").max(100),
  recognizedText: z.string().min(1, "인식된 텍스트가 필요합니다").max(500),
  duration: z.number().int().min(0).optional().default(0),
  mode: z.enum(["voice", "text"]).optional().default("voice"),
})

export type PronunciationAnalyzeInput = z.infer<typeof pronunciationAnalyzeSchema>

/**
 * 발음 이력 조회 검증 스키마
 */
export const pronunciationHistorySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

export type PronunciationHistoryInput = z.infer<typeof pronunciationHistorySchema>
```

---

### Step 3: 발음 진단 API 구현 (3-4일차)

#### 3.1 발음 분석 API
`app/api/pronunciation/analyze/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSessionFromRequest } from "@/shared/lib/get-session"
import prisma from "@/lib/db"
import { analyzePronunciation } from "@/lib/pronunciation/analyzer"
import { pronunciationAnalyzeSchema } from "@/lib/pronunciation/validation"

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = pronunciationAnalyzeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { targetWord, recognizedText, duration, mode } = parsed.data

    // 발음 분석
    const result = analyzePronunciation(targetWord, recognizedText)

    // 결과 저장
    const attempt = await prisma.pronunciationAttempt.create({
      data: {
        userId: session.user.id,
        word: targetWord,
        targetWord,
        recognizedText,
        overallScore: result.overallScore,
        phonemeScores: result.phonemeScores,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        duration: duration || 0,
      }
    })

    // 프로필 통계 업데이트
    await updatePronunciationStats(session.user.id)

    return NextResponse.json({
      attemptId: attempt.id,
      overallScore: result.overallScore,
      phonemeScores: result.phonemeScores,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
    })
  } catch (error) {
    console.error("Pronunciation analysis error:", error)
    return NextResponse.json(
      { error: "발음 분석 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

async function updatePronunciationStats(userId: string) {
  const attempts = await prisma.pronunciationAttempt.findMany({
    where: { userId },
    select: { overallScore: true }
  })

  if (attempts.length === 0) return

  const averageScore = Math.round(
    attempts.reduce((sum, a) => sum + a.overallScore, 0) / attempts.length
  )

  await prisma.userProfile.update({
    where: { userId },
    data: {
      pronunciationScore: averageScore,
      totalPronunciations: attempts.length,
    }
  })
}
```

#### 3.2 발음 이력 조회 API
`app/api/pronunciation/history/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getSessionFromRequest } from "@/shared/lib/get-session"
import prisma from "@/lib/db"
import { pronunciationHistorySchema } from "@/lib/pronunciation/validation"

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
    const parsed = pronunciationHistorySchema.safeParse({
      limit: searchParams.get('limit'),
    })
    const limit = parsed.success ? parsed.data.limit : 10

    const attempts = await prisma.pronunciationAttempt.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      attempts: attempts.map(a => ({
        id: a.id,
        word: a.word,
        overallScore: a.overallScore,
        feedback: a.feedback,
        createdAt: a.createdAt,
      })),
      total: attempts.length,
    })
  } catch (error) {
    console.error("Pronunciation history error:", error)
    return NextResponse.json(
      { error: "이력 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

---

### Step 4: 프론트엔드 UI 구현 (4-7일차)

#### 4.1 발음 진단 페이지
`app/pronunciation/page.tsx`:
```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface PronunciationResult {
  overallScore: number
  phonemeScores: {
    phoneme: string
    accuracy: number
    severity: string
  }[]
  feedback: string
  strengths: string[]
  improvements: string[]
}

export default function PronunciationPage() {
  const router = useRouter()
  const [targetWord, setTargetWord] = useState("apple")
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PronunciationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    // SSR 환경 안전 가드: Next.js 서버 렌더링 시 window 객체 없음
    if (typeof window === 'undefined') return

    // Web Speech API 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.')
    }
  }, [])

  const startRecording = () => {
    setError(null)
    setResult(null)

    // Web Speech API 초기화
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsRecording(true)
      startTimeRef.current = Date.now()
    }

    recognition.onresult = async (event: any) => {
      const recognizedText = event.results[0][0].transcript
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)

      setIsRecording(false)
      setIsAnalyzing(true)

      try {
        const response = await fetch('/api/pronunciation/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetWord,
            recognizedText,
            duration,
          })
        })

        if (!response.ok) throw new Error('분석 실패')

        const data = await response.json()
        setResult(data)
      } catch (err) {
        setError('발음 분석 중 오류가 발생했습니다')
      } finally {
        setIsAnalyzing(false)
      }
    }

    recognition.onerror = (event: any) => {
      setIsRecording(false)
      setError('음성 인식 오류: ' + event.error)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">발음 진단</h1>
          <p className="text-gray-600">
            마이크를 사용하여 정확한 발음을 연습하세요
          </p>
        </div>

        {/* 단어 선택 */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연습할 단어
          </label>
          <input
            type="text"
            value={targetWord}
            onChange={(e) => setTargetWord(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예: apple, banana, hello"
          />
        </div>

        {/* 녹음 영역 */}
        <div className="bg-white rounded-lg shadow p-12 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-6">{targetWord}</div>

            {!isRecording && !isAnalyzing && (
              <button
                onClick={startRecording}
                className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all"
                disabled={!targetWord}
              >
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                </svg>
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="inline-flex items-center justify-center w-24 h-24 bg-red-600 hover:bg-red-700 text-white rounded-full animate-pulse"
              >
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/>
                </svg>
              </button>
            )}

            {isAnalyzing && (
              <div className="inline-flex items-center justify-center w-24 h-24">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
              </div>
            )}

            <div className="mt-6 text-sm text-gray-600">
              {isRecording && '🎤 말하세요...'}
              {isAnalyzing && '⏳ 분석 중...'}
              {!isRecording && !isAnalyzing && '🎯 버튼을 눌러 녹음 시작'}
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="bg-white rounded-lg shadow p-8">
            {/* 전체 점수 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4">
                <span className="text-4xl font-bold">{result.overallScore}</span>
              </div>
              <p className="text-xl font-medium text-gray-800">{result.feedback}</p>
            </div>

            {/* 음소별 분석 표 */}
            {result.phonemeScores.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">음소별 분석</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">음소</th>
                        <th className="px-4 py-2 text-left">정확도</th>
                        <th className="px-4 py-2 text-left">상태</th>
                        <th className="px-4 py-2 text-left">피드백</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.phonemeScores.map((score, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-3 font-mono font-bold">
                            {score.phoneme}
                          </td>
                          <td className="px-4 py-3">
                            {score.accuracy}%
                          </td>
                          <td className="px-4 py-3">
                            {score.severity === 'excellent' && '✅ 우수'}
                            {score.severity === 'good' && '👍 좋음'}
                            {score.severity === 'fair' && '⚠️ 보통'}
                            {score.severity === 'needs-improvement' && '❌ 개선필요'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {score.severity === 'excellent' && '정확합니다'}
                            {score.severity === 'good' && '좋습니다'}
                            {score.severity === 'fair' && '더 연습하세요'}
                            {score.severity === 'needs-improvement' && '집중 연습 필요'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 강점 */}
            {result.strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-green-600">💪 잘한 점</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.strengths.map((s, idx) => (
                    <li key={idx} className="text-gray-700">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선점 */}
            {result.improvements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-orange-600">📈 개선할 점</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.improvements.map((i, idx) => (
                    <li key={idx} className="text-gray-700">{i}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                다시 연습하기
              </button>
              <button
                onClick={() => router.push('/pronunciation/history')}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                이력 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 4.2 발음 이력 페이지
`app/pronunciation/history/page.tsx`:
```typescript
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface PronunciationAttemptSummary {
  id: string
  word: string
  overallScore: number
  feedback: string | null
  createdAt: string
}

export default function PronunciationHistoryPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<PronunciationAttemptSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/pronunciation/history?limit=20')
        if (!response.ok) throw new Error('이력 조회 실패')

        const data = await response.json()
        setAttempts(data.attempts)
      } catch (err) {
        setError('발음 이력을 불러오는 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">발음 연습 이력</h1>
          <button
            onClick={() => router.push('/pronunciation')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            연습하기
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">이력을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!isLoading && !error && attempts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">아직 발음 연습 기록이 없습니다</p>
            <button
              onClick={() => router.push('/pronunciation')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              첫 연습 시작하기
            </button>
          </div>
        )}

        {attempts.length > 0 && (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{attempt.word}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(attempt.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(attempt.overallScore)}`}>
                    {attempt.overallScore}점
                  </div>
                </div>
                {attempt.feedback && (
                  <p className="mt-3 text-gray-600">{attempt.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### Step 5: 텍스트 모드 구현 (7일차)

핵심 목표에 포함된 **텍스트 모드**를 구현한다. 음성 인식이 불가능한 환경에서 텍스트 입력으로 발음을 연습할 수 있도록 한다.

#### 5.1 모드 토글 UI
`app/pronunciation/page.tsx`에 추가:

발음 진단 페이지의 state에 모드 상태를 추가한다:
```typescript
const [mode, setMode] = useState<"voice" | "text">("voice")
const [textInput, setTextInput] = useState("")
```

단어 선택 영역 아래에 모드 토글 UI를 추가한다:
```typescript
{/* 모드 선택 */}
<div className="bg-white rounded-lg shadow p-4 mb-6">
  <div className="flex rounded-lg overflow-hidden border border-gray-300">
    <button
      onClick={() => setMode("voice")}
      className={`flex-1 py-2 text-sm font-medium transition-colors ${
        mode === "voice"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      🎤 음성 모드
    </button>
    <button
      onClick={() => setMode("text")}
      className={`flex-1 py-2 text-sm font-medium transition-colors ${
        mode === "text"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      ⌨️ 텍스트 모드
    </button>
  </div>
</div>
```

#### 5.2 텍스트 입력 영역
음성 녹음 영역과 조건부로 표시:
```typescript
{mode === "text" && (
  <div className="bg-white rounded-lg shadow p-8 mb-6">
    <div className="text-center">
      <div className="text-5xl font-bold mb-6">{targetWord}</div>
      <input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500"
        placeholder="위 단어를 영어로 입력하세요"
      />
      <button
        onClick={handleTextSubmit}
        disabled={!textInput.trim() || isAnalyzing}
        className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isAnalyzing ? '분석 중...' : '분석하기'}
      </button>
    </div>
  </div>
)}
```

#### 5.3 텍스트 제출 핸들러
```typescript
const handleTextSubmit = async () => {
  if (!textInput.trim()) return

  setIsAnalyzing(true)
  setError(null)
  setResult(null)

  try {
    const response = await fetch('/api/pronunciation/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWord,
        recognizedText: textInput.trim(),
        duration: 0,
        mode: "text",
      })
    })

    if (!response.ok) throw new Error('분석 실패')

    const data = await response.json()
    setResult(data)
  } catch (err) {
    setError('텍스트 분석 중 오류가 발생했습니다')
  } finally {
    setIsAnalyzing(false)
  }
}
```

> **참고**: 텍스트 모드는 실제 발음이 아닌 철자(spelling) 정확도를 분석합니다. 음성 모드와 동일한 Levenshtein Distance 알고리즘을 사용하되, `mode` 필드로 구분하여 이력에 기록합니다.

---

## 📁 FSD 디렉토리 구조

Phase 1-4에서 생성할 FSD 기반 디렉토리:

```
study-eng-h/
├── app/
│   ├── api/
│   │   └── pronunciation/
│   │       ├── analyze/
│   │       │   └── route.ts             # 발음 분석 API
│   │       └── history/
│   │           └── route.ts             # 발음 이력 조회 API
│   └── pronunciation/
│       ├── page.tsx                     # 발음 진단 메인 페이지
│       └── history/
│           └── page.tsx                 # 발음 이력 페이지
├── lib/
│   └── pronunciation/
│       ├── analyzer.ts                  # 발음 분석 로직
│       └── validation.ts               # Zod 검증 스키마
└── prisma/
    └── schema.prisma                    # PronunciationAttempt 모델 추가
```

> **참고**: `shared/lib/get-session.ts` (세션 헬퍼)는 Phase 1-2에서 생성됨.

---

## ✅ 완료 체크리스트

### 사전 작업
- [ ] Phase 1-2 완료 확인 (UserProfile, 세션 헬퍼)
- [ ] Phase 1-3 완료 확인 (어휘 시스템)

### 데이터베이스
- [ ] Schema 확장 완료 (PronunciationAttempt)
- [ ] User, UserProfile 관계 추가
- [ ] 마이그레이션 성공

### 검증
- [ ] Zod 검증 스키마 구현 (validation.ts)

### 발음 분석
- [ ] Web Speech API 통합
- [ ] 발음 분석 알고리즘 (Levenshtein Distance)
- [ ] 음소별 정확도 계산
- [ ] 피드백 생성 로직

### API
- [ ] 발음 분석 API (`POST /api/pronunciation/analyze`)
- [ ] 이력 조회 API (`GET /api/pronunciation/history`)
- [ ] 프로필 통계 업데이트

### UI
- [ ] 발음 진단 페이지 (음성 모드)
- [ ] 녹음 UI (마이크 아이콘)
- [ ] 결과 표시 (표 형식)
- [ ] 이력 페이지 (`/pronunciation/history`)
- [ ] 텍스트 모드 토글 UI
- [ ] 텍스트 입력 → 분석 제출

---

## 🧪 테스트 시나리오

### Web Speech API
1. [ ] 브라우저 지원 확인 (Chrome, Edge)
2. [ ] 음성 인식 정확도
3. [ ] 오류 처리 (마이크 권한 거부, 네트워크 오류)
4. [ ] SSR 환경 안전성 (window 객체 가드)

### 발음 분석
1. [ ] 유사도 계산 정확성 (Levenshtein Distance)
2. [ ] 음소별 분석 (글자 단위 비교)
3. [ ] 피드백 생성 (점수별 메시지)
4. [ ] Zod 입력 검증 (잘못된 입력 처리)

### 텍스트 모드
1. [ ] 모드 토글 UI 동작
2. [ ] 텍스트 입력 → 분석 제출
3. [ ] 음성/텍스트 모드 이력 구분

---

## 🚀 다음 단계

Phase 1-4 완료 후:
- Phase 1-5: 게이미피케이션 시스템
  - 스트릭, 리그, 배지 구현
  - 발음 연습 횟수 → 게이미피케이션 연동

### Phase 2 발음 고도화 방향 (참고)
- Google Cloud Speech-to-Text API 연동 (실제 IPA 음소 분석)
- 파형(waveform) 비교 및 시각화
- 억양(intonation) 분석
- `speakingRate`, `pausePattern` 등 상위 계획서 명세 구현
- 원어민 발음 비교 기능

---

## 📝 변경 이력

| 일자 | 변경 내용 |
|------|-----------|
| 2026-01-30 | 초안 작성 |
| 2026-01-30 | 기술 스택 전제 조건 테이블 추가 |
| 2026-01-30 | NextAuth → Better Auth 전환 반영 (`getSessionFromRequest`) |
| 2026-01-30 | Prisma import 방식 수정 (default export) |
| 2026-01-30 | Zod 검증 스키마 추가 |
| 2026-01-30 | 텍스트 모드 구현 상세 추가 (Step 5) |
| 2026-01-30 | 발음 이력 페이지 추가 (Step 4.2) |
| 2026-01-30 | FSD 디렉토리 구조 섹션 추가 |
| 2026-01-30 | 음소 분석 한계점 노트 추가 |
| 2026-01-30 | SSR 안전성 가드 추가 |
| 2026-01-30 | 마이크 아이콘 SVG 수정 |
| 2026-01-30 | 체크리스트/테스트 시나리오 표기 통일 (`[ ]`) |
| 2026-01-30 | PronunciationAttempt 모델에 `updatedAt` 추가 |
| 2026-01-30 | 변수명 오타 수정 (`normalizedTarget`) |
