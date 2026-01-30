# Phase 1-6: 대시보드 및 통계 시스템

## 📋 문서 정보
- **Phase**: 1-6
- **기간**: 1-1.5주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-2 ~ 1-5 (모든 기능 완료 후)
- **목표**: 학습 진행도 시각화 및 통계 대시보드 구현

---

## 🎯 Phase 목표

### 핵심 목표
- ✅ 메인 대시보드 UI
- ✅ 학습 통계 시각화 (Recharts)
- ✅ 일일/주간/월간 통계
- ✅ 카테고리별 학습 현황
- ✅ 프로그레스 트래커

---

## 🏗️ 구현 단계

### Step 1: 통계 집계 API 구현 (1-2일차)

#### 1.1 대시보드 통계 API
`app/api/dashboard/stats/route.ts`:
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
    const period = searchParams.get('period') || 'week' // day, week, month, all

    const userId = session.user.id

    // 1. 프로필 정보
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    // 2. 스트릭 정보
    const streak = await prisma.userStreak.findUnique({
      where: { userId }
    })

    // 3. 리그 정보
    const league = await prisma.userLeague.findUnique({
      where: { userId }
    })

    // 4. 기간별 학습 통계
    const periodStats = await getPeriodStats(userId, period)

    // 5. 카테고리별 학습
    const categoryStats = await getCategoryStats(userId)

    // 6. 최근 활동
    const recentActivity = await getRecentActivity(userId)

    return NextResponse.json({
      profile: {
        level: profile?.level || 'A1',
        totalXP: profile?.totalXP || 0,
        totalWordLearned: profile?.totalWordLearned || 0,
        masteredWords: profile?.masteredWords || 0,
        reviewNeeded: profile?.reviewNeeded || 0,
        pronunciationScore: profile?.pronunciationScore || 0,
      },
      streak: {
        current: streak?.currentStreak || 0,
        longest: streak?.longestStreak || 0,
        freezeCount: streak?.freezeCount || 0,
      },
      league: {
        tier: league?.tier || 1,
        points: league?.leaguePoints || 0,
      },
      periodStats,
      categoryStats,
      recentActivity,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

/**
 * 기간별 학습 통계
 */
async function getPeriodStats(userId: string, period: string) {
  const now = new Date()
  let startDate = new Date()

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'all':
      startDate = new Date(0)
      break
  }

  // 퀴즈 통계
  const quizAttempts = await prisma.userQuizAttempt.findMany({
    where: {
      userId,
      attemptedAt: { gte: startDate }
    }
  })

  const totalQuizzes = quizAttempts.length
  const correctQuizzes = quizAttempts.filter(a => a.isCorrect).length
  const quizAccuracy = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0

  // 플래시카드 통계
  const flashcardSessions = await prisma.flashcardSession.findMany({
    where: {
      userId,
      createdAt: { gte: startDate }
    }
  })

  const totalSessions = flashcardSessions.length
  const totalStudyTime = flashcardSessions.reduce((sum, s) => sum + s.duration, 0)
  const avgAccuracy = totalSessions > 0
    ? flashcardSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
    : 0

  // 일별 학습 시간 (최근 7일)
  const dailyStats = await getDailyStats(userId, 7)

  return {
    totalQuizzes,
    quizAccuracy: Math.round(quizAccuracy),
    totalSessions,
    totalStudyTime,
    avgAccuracy: Math.round(avgAccuracy),
    dailyStats,
  }
}

/**
 * 일별 학습 통계
 */
async function getDailyStats(userId: string, days: number) {
  const stats = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const sessions = await prisma.flashcardSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    })

    const studyTime = sessions.reduce((sum, s) => sum + s.duration, 0)

    stats.push({
      date: date.toISOString().split('T')[0],
      studyTime: Math.round(studyTime / 60), // 분 단위
      sessions: sessions.length,
    })
  }

  return stats
}

/**
 * 카테고리별 학습 통계
 */
async function getCategoryStats(userId: string) {
  const vocabularies = await prisma.userVocabulary.findMany({
    where: { userId },
    include: {
      vocabulary: true
    }
  })

  const categoryMap: Record<string, number> = {}

  vocabularies.forEach(uv => {
    const category = uv.vocabulary.category
    categoryMap[category] = (categoryMap[category] || 0) + 1
  })

  return Object.entries(categoryMap).map(([category, count]) => ({
    category,
    count,
  }))
}

/**
 * 최근 활동 내역
 */
async function getRecentActivity(userId: string) {
  const activities = []

  // 최근 퀴즈
  const recentQuizzes = await prisma.userQuizAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: 'desc' },
    take: 5,
    include: {
      question: true
    }
  })

  activities.push(...recentQuizzes.map(q => ({
    type: 'quiz',
    description: `퀴즈 학습: ${q.question.koreanHint}`,
    timestamp: q.attemptedAt,
    result: q.isCorrect ? 'success' : 'fail',
  })))

  // 최근 플래시카드
  const recentFlashcards = await prisma.flashcardSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  activities.push(...recentFlashcards.map(f => ({
    type: 'flashcard',
    description: `플래시카드 학습: ${f.vocabularyCount}개 단어`,
    timestamp: f.createdAt,
    result: 'success',
  })))

  // 시간순 정렬
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return activities.slice(0, 10)
}
```

---

### Step 2: 메인 대시보드 UI 구현 (2-5일차)

#### 2.1 대시보드 메인 페이지
`app/dashboard/page.tsx`:
```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface DashboardStats {
  profile: {
    level: string
    totalXP: number
    totalWordLearned: number
    masteredWords: number
    reviewNeeded: number
    pronunciationScore: number
  }
  streak: {
    current: number
    longest: number
    freezeCount: number
  }
  league: {
    tier: number
    points: number
  }
  periodStats: {
    totalQuizzes: number
    quizAccuracy: number
    totalSessions: number
    totalStudyTime: number
    avgAccuracy: number
    dailyStats: { date: string; studyTime: number; sessions: number }[]
  }
  categoryStats: { category: string; count: number }[]
  recentActivity: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [period, setPeriod] = useState('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard/stats?period=${period}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const TIER_NAMES = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master']
  const TIER_ICONS = ['', '🥉', '🥈', '🥇', '💎', '💠', '🌟']

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">대시보드</h1>
          <p className="text-gray-600">학습 진행 상황을 한눈에 확인하세요</p>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* XP */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">총 XP</span>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-3xl font-bold">{stats.profile.totalXP.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">레벨: {stats.profile.level}</div>
          </div>

          {/* 학습 단어 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">학습 단어</span>
              <span className="text-2xl">📚</span>
            </div>
            <div className="text-3xl font-bold">{stats.profile.totalWordLearned}</div>
            <div className="text-sm text-gray-500 mt-1">
              마스터: {stats.profile.masteredWords}
            </div>
          </div>

          {/* 스트릭 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">연속 학습</span>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-3xl font-bold">{stats.streak.current}일</div>
            <div className="text-sm text-gray-500 mt-1">
              최장: {stats.streak.longest}일
            </div>
          </div>

          {/* 리그 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">리그</span>
              <span className="text-2xl">{TIER_ICONS[stats.league.tier]}</span>
            </div>
            <div className="text-3xl font-bold">{TIER_NAMES[stats.league.tier]}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.league.points.toLocaleString()} 포인트
            </div>
          </div>
        </div>

        {/* 복습 필요 & 퀵 액션 */}
        {stats.profile.reviewNeeded > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-yellow-800 mb-1">
                  📝 복습이 필요한 단어가 {stats.profile.reviewNeeded}개 있습니다
                </h3>
                <p className="text-sm text-yellow-700">
                  지금 복습하고 기억을 강화하세요!
                </p>
              </div>
              <button
                onClick={() => router.push('/flashcard?mode=review')}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                복습 시작
              </button>
            </div>
          </div>
        )}

        {/* 차트 영역 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 일별 학습 시간 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">일별 학습 시간</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.periodStats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => value.split('-')[2]} />
                <YAxis label={{ value: '분', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="studyTime"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="학습 시간"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 카테고리별 학습 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">카테고리별 학습</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.categoryStats}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 학습 통계 요약 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">퀴즈 통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">완료한 퀴즈</span>
                <span className="font-bold">{stats.periodStats.totalQuizzes}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">정확도</span>
                <span className="font-bold text-green-600">
                  {stats.periodStats.quizAccuracy}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">플래시카드 통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학습 세션</span>
                <span className="font-bold">{stats.periodStats.totalSessions}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 학습 시간</span>
                <span className="font-bold">
                  {Math.round(stats.periodStats.totalStudyTime / 60)}분
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">발음 통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">평균 점수</span>
                <span className="font-bold text-blue-600">
                  {stats.profile.pronunciationScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.profile.pronunciationScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">최근 활동</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-800">{activity.description}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 시작 버튼 */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <button
            onClick={() => router.push('/quiz')}
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-all"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-bold text-lg">퀴즈 학습</div>
            <div className="text-sm opacity-90">새로운 문제 풀기</div>
          </button>

          <button
            onClick={() => router.push('/flashcard')}
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-all"
          >
            <div className="text-3xl mb-2">🃏</div>
            <div className="font-bold text-lg">플래시카드</div>
            <div className="text-sm opacity-90">단어 암기하기</div>
          </button>

          <button
            onClick={() => router.push('/pronunciation')}
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-all"
          >
            <div className="text-3xl mb-2">🎤</div>
            <div className="font-bold text-lg">발음 연습</div>
            <div className="text-sm opacity-90">정확한 발음 익히기</div>
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

### API
- [ ] 통계 집계 API
- [ ] 기간별 통계
- [ ] 카테고리별 통계
- [ ] 최근 활동 조회

### UI
- [ ] 메인 대시보드
- [ ] 차트 시각화 (Recharts)
- [ ] 통계 카드
- [ ] 최근 활동 목록

### 차트
- [ ] 일별 학습 시간 (Line Chart)
- [ ] 카테고리별 분포 (Pie Chart)
- [ ] 프로그레스 바

---

## 🧪 테스트 시나리오

### 통계 API
1. ✅ 기간별 데이터 정확성
2. ✅ 집계 로직 검증
3. ✅ 성능 최적화

### UI
1. ✅ 차트 렌더링
2. ✅ 반응형 디자인
3. ✅ 로딩 상태

---

## 🚀 최종 완료

Phase 1-6 완료 후:
- ✅ 모든 Phase 1 기능 통합
- ✅ 전체 시스템 테스트
- ✅ 베타 런칭 준비

---

## 📚 Recharts 설치

```bash
npm install recharts
```

---

## 🎉 Phase 1 전체 완료!

이제 모든 Phase 1 기능이 구현되었습니다:
- ✅ Phase 1-1: 인증 시스템
- ✅ Phase 1-2: AI 레벨 진단 및 퀴즈
- ✅ Phase 1-3: 어휘 학습 및 SRS
- ✅ Phase 1-4: 발음 진단
- ✅ Phase 1-5: 게이미피케이션
- ✅ Phase 1-6: 대시보드 및 통계

**다음 단계**: 베타 테스트 및 사용자 피드백 수집
