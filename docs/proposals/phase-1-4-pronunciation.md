# Phase 1-4: 발음 진단 시스템

## 📋 문서 정보
- **Phase**: 1-4
- **기간**: 1-1.5주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-3 (어휘 학습)
- **목표**: Web Speech API 기반 발음 정밀 진단 및 피드백 시스템

---

## 🎯 Phase 목표

### 핵심 목표
- ✅ Web Speech API 통합
- ✅ 음소별 정확도 분석
- ✅ 표 형식 결과 UI
- ✅ 발음 개선 피드백
- ✅ 텍스트 모드 지원

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

  @@index([userId, createdAt])
  @@map("pronunciation_attempts")
}

// User 모델에 관계 추가
model User {
  // ... 기존 필드들

  pronunciationAttempts PronunciationAttempt[]
}

// UserProfile 모델 확장
model UserProfile {
  // ... 기존 필드들

  // 발음 통계
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
  const normalized Target = normalizeText(targetWord)
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

### Step 3: 발음 진단 API 구현 (3-4일차)

#### 3.1 발음 분석 API
`app/api/pronunciation/analyze/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { analyzePronunciation } from "@/lib/pronunciation/analyzer"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { targetWord, recognizedText, duration } = await req.json()

    if (!targetWord || !recognizedText) {
      return NextResponse.json(
        { error: "필수 데이터가 누락되었습니다" },
        { status: 400 }
      )
    }

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
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

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
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
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

---

## ✅ 완료 체크리스트

### 데이터베이스
- [ ] Schema 확장 완료
- [ ] 마이그레이션 성공

### 발음 분석
- [ ] Web Speech API 통합
- [ ] 발음 분석 알고리즘
- [ ] 음소별 정확도 계산
- [ ] 피드백 생성 로직

### API
- [ ] 발음 분석 API
- [ ] 이력 조회 API
- [ ] 통계 업데이트

### UI
- [ ] 발음 진단 페이지
- [ ] 녹음 UI
- [ ] 결과 표시 (표 형식)
- [ ] 이력 페이지

---

## 🧪 테스트 시나리오

### Web Speech API
1. ✅ 브라우저 지원 확인
2. ✅ 음성 인식 정확도
3. ✅ 오류 처리

### 발음 분석
1. ✅ 유사도 계산 정확성
2. ✅ 음소별 분석
3. ✅ 피드백 생성

---

## 🚀 다음 단계

Phase 1-4 완료 후:
- ✅ Phase 1-5: 게이미피케이션 시스템
- ✅ 스트릭, 리그, 배지 구현
