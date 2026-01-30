# Phase 1-5: 게이미피케이션 시스템

## 📋 문서 정보
- **Phase**: 1-5
- **기간**: 1.5-2주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-2, 1-3, 1-4
- **목표**: 스트릭, 리그, 배지 시스템으로 학습 동기부여 극대화

---

## 🎯 Phase 목표

### 핵심 목표
- ✅ 일일 스트릭 시스템 (연속 학습일 추적)
- ✅ 글로벌 리그 시스템 (6단계: Bronze ~ Master)
- ✅ 기본 배지 시스템 (20개)
- ✅ XP 포인트 시스템
- ✅ 스트릭 보호권 기능

---

## 🏗️ 구현 단계

### Step 1: 데이터베이스 스키마 확장 (1일차)

#### 1.1 Prisma Schema 추가
`prisma/schema.prisma`에 추가:
```prisma
// 리그 시스템
model UserLeague {
  id              String   @id @default(cuid())
  userId          String   @unique
  tier            Int      @default(1)  // 1=Bronze, 2=Silver, ... 6=Master
  leaguePoints    Int      @default(0)
  joinedAt        DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tier, leaguePoints])
  @@map("user_leagues")
}

// 스트릭 시스템
model UserStreak {
  id              String   @id @default(cuid())
  userId          String   @unique
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastStudyDate   DateTime?
  freezeCount     Int      @default(0)  // 남은 스트릭 보호권 수

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_streaks")
}

// 배지 시스템
model Achievement {
  id              String   @id @default(cuid())
  code            String   @unique  // first_step, vocab_10 등
  name            String              // "First Step"
  description     String              // "첫 레슨 완료"
  icon            String              // "🏆"
  category        String              // learning, streak, accuracy, league
  requirement     Int                 // 달성 조건 수치

  userAchievements UserAchievement[]

  createdAt       DateTime @default(now())

  @@map("achievements")
}

model UserAchievement {
  id              String   @id @default(cuid())
  userId          String
  achievementId   String
  unlockedAt      DateTime @default(now())

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement     Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId, unlockedAt])
  @@map("user_achievements")
}

// User 모델에 관계 추가
model User {
  // ... 기존 필드들

  league          UserLeague?
  streak          UserStreak?
  achievements    UserAchievement[]
}

// UserProfile 모델 확장
model UserProfile {
  // ... 기존 필드들

  // 일일 목표
  dailyGoalMinutes Int      @default(10)  // 일일 학습 시간 목표 (분)
  dailyGoalWords   Int      @default(15)  // 일일 단어 목표
}
```

#### 1.2 마이그레이션
```bash
npx prisma migrate dev --name add_gamification
npx prisma generate
```

---

### Step 2: 스트릭 시스템 구현 (2-3일차)

#### 2.1 스트릭 관리 서비스
`lib/gamification/streak.ts`:
```typescript
import { prisma } from "@/lib/db"

/**
 * 스트릭 업데이트
 */
export async function updateStreak(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = await prisma.userStreak.findUnique({
    where: { userId }
  })

  // 스트릭 레코드가 없으면 생성
  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
        freezeCount: 0,
      }
    })
    return streak
  }

  const lastStudy = streak.lastStudyDate
  if (!lastStudy) {
    // 첫 학습
    return await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
      }
    })
  }

  const lastStudyDate = new Date(lastStudy)
  lastStudyDate.setHours(0, 0, 0, 0)

  const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    // 오늘 이미 학습함 - 변경 없음
    return streak
  } else if (daysDiff === 1) {
    // 연속 학습 - 스트릭 증가
    const newStreak = streak.currentStreak + 1
    const newLongest = Math.max(newStreak, streak.longestStreak)

    return await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStudyDate: today,
      }
    })
  } else {
    // 스트릭 끊김 - 리셋 (보호권 체크)
    if (streak.freezeCount > 0) {
      // 보호권 사용
      return await prisma.userStreak.update({
        where: { userId },
        data: {
          lastStudyDate: today,
          freezeCount: streak.freezeCount - 1,
        }
      })
    } else {
      // 스트릭 리셋
      return await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastStudyDate: today,
        }
      })
    }
  }
}

/**
 * 스트릭 보호권 지급
 */
export async function grantStreakFreeze(userId: string, count: number = 1) {
  await prisma.userStreak.update({
    where: { userId },
    data: {
      freezeCount: { increment: count }
    }
  })
}

/**
 * 스트릭 마일스톤 체크
 */
export async function checkStreakMilestones(userId: string, currentStreak: number) {
  const milestones = [
    { days: 7, xp: 50, freezeReward: 1 },
    { days: 14, xp: 100, freezeReward: 1 },
    { days: 30, xp: 300, freezeReward: 2 },
    { days: 100, xp: 1000, freezeReward: 3 },
  ]

  for (const milestone of milestones) {
    if (currentStreak === milestone.days) {
      // XP 지급
      await prisma.userProfile.update({
        where: { userId },
        data: {
          totalXP: { increment: milestone.xp }
        }
      })

      // 스트릭 보호권 지급
      await grantStreakFreeze(userId, milestone.freezeReward)

      return {
        milestone: milestone.days,
        xpReward: milestone.xp,
        freezeReward: milestone.freezeReward,
      }
    }
  }

  return null
}
```

---

### Step 3: 리그 시스템 구현 (3-5일차)

#### 3.1 리그 관리 서비스
`lib/gamification/league.ts`:
```typescript
import { prisma } from "@/lib/db"

export interface LeagueTier {
  tier: number
  name: string
  minPoints: number
  maxPoints: number
  icon: string
  color: string
}

export const LEAGUE_TIERS: LeagueTier[] = [
  { tier: 1, name: 'Bronze', minPoints: 0, maxPoints: 999, icon: '🥉', color: '#CD7F32' },
  { tier: 2, name: 'Silver', minPoints: 1000, maxPoints: 1999, icon: '🥈', color: '#C0C0C0' },
  { tier: 3, name: 'Gold', minPoints: 2000, maxPoints: 3999, icon: '🥇', color: '#FFD700' },
  { tier: 4, name: 'Platinum', minPoints: 4000, maxPoints: 5999, icon: '💎', color: '#E5E4E2' },
  { tier: 5, name: 'Diamond', minPoints: 6000, maxPoints: 7999, icon: '💠', color: '#B9F2FF' },
  { tier: 6, name: 'Master', minPoints: 8000, maxPoints: Infinity, icon: '🌟', color: '#9C27B0' },
]

/**
 * 리그 포인트 추가
 */
export async function addLeaguePoints(userId: string, points: number) {
  let league = await prisma.userLeague.findUnique({
    where: { userId }
  })

  // 리그 레코드가 없으면 생성
  if (!league) {
    league = await prisma.userLeague.create({
      data: {
        userId,
        tier: 1,
        leaguePoints: points,
      }
    })
  } else {
    league = await prisma.userLeague.update({
      where: { userId },
      data: {
        leaguePoints: { increment: points }
      }
    })
  }

  // 승급 체크
  const newTier = calculateTier(league.leaguePoints)
  if (newTier > league.tier) {
    league = await prisma.userLeague.update({
      where: { userId },
      data: { tier: newTier }
    })

    return {
      league,
      promoted: true,
      newTierName: LEAGUE_TIERS[newTier - 1].name
    }
  }

  return { league, promoted: false }
}

/**
 * 포인트로 티어 계산
 */
function calculateTier(points: number): number {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (points >= LEAGUE_TIERS[i].minPoints) {
      return LEAGUE_TIERS[i].tier
    }
  }
  return 1
}

/**
 * 리그 내 랭킹 조회
 */
export async function getLeagueRanking(tier: number, limit: number = 10) {
  const users = await prisma.userLeague.findMany({
    where: { tier },
    orderBy: {
      leaguePoints: 'desc'
    },
    take: limit,
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  })

  return users.map((league, index) => ({
    rank: index + 1,
    userId: league.userId,
    nickname: league.user.profile?.nickname || league.user.name,
    points: league.leaguePoints,
    tier: league.tier,
  }))
}

/**
 * 포인트 획득 이벤트
 */
export const POINT_EVENTS = {
  LESSON_COMPLETE: 100,
  PERFECT_SCORE: 150,
  DAILY_STREAK: 50,
  DAILY_GOAL: 200,
  WEEKLY_GOAL: 300,
} as const
```

---

### Step 4: 배지 시스템 구현 (5-7일차)

#### 4.1 배지 관리 서비스
`lib/gamification/achievements.ts`:
```typescript
import { prisma } from "@/lib/db"

export interface AchievementDefinition {
  code: string
  name: string
  description: string
  icon: string
  category: string
  requirement: number
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // 학습 배지
  { code: 'first_step', name: 'First Step', description: '첫 레슨 완료', icon: '🏆', category: 'learning', requirement: 1 },
  { code: 'vocab_10', name: 'Vocab 10', description: '10개 단어 학습', icon: '📚', category: 'learning', requirement: 10 },
  { code: 'vocab_50', name: 'Vocab 50', description: '50개 단어 학습', icon: '📚', category: 'learning', requirement: 50 },
  { code: 'vocab_100', name: 'Vocab 100', description: '100개 단어 학습', icon: '📚', category: 'learning', requirement: 100 },
  { code: 'vocab_500', name: 'Vocab 500', description: '500개 단어 학습', icon: '📚', category: 'learning', requirement: 500 },

  // 스트릭 배지
  { code: 'streak_7', name: '7-Day Streak', description: '7일 연속 학습', icon: '🔥', category: 'streak', requirement: 7 },
  { code: 'streak_14', name: '14-Day Streak', description: '14일 연속 학습', icon: '⚡', category: 'streak', requirement: 14 },
  { code: 'streak_30', name: '30-Day Streak', description: '30일 연속 학습', icon: '⚡', category: 'streak', requirement: 30 },
  { code: 'streak_100', name: '100-Day Streak', description: '100일 연속 학습', icon: '💯', category: 'streak', requirement: 100 },

  // 정확도 배지
  { code: 'accuracy_80', name: 'Accuracy 80%', description: '정확도 80% 이상', icon: '✨', category: 'accuracy', requirement: 80 },
  { code: 'perfect_day', name: 'Perfect Day', description: '하루 완벽 정확도', icon: '✨', category: 'accuracy', requirement: 100 },

  // 리그 배지
  { code: 'bronze_league', name: 'Bronze', description: '브론즈 리그 달성', icon: '🥉', category: 'league', requirement: 1 },
  { code: 'silver_league', name: 'Silver', description: '실버 리그 달성', icon: '🥈', category: 'league', requirement: 2 },
  { code: 'gold_league', name: 'Gold', description: '골드 리그 달성', icon: '🥇', category: 'league', requirement: 3 },

  // 특별 배지
  { code: 'early_adopter', name: 'Early Adopter', description: '초기 가입자', icon: '🎁', category: 'special', requirement: 1 },
]

/**
 * 배지 달성 체크
 */
export async function checkAchievements(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId }
  })

  const streak = await prisma.userStreak.findUnique({
    where: { userId }
  })

  const league = await prisma.userLeague.findUnique({
    where: { userId }
  })

  if (!profile) return []

  const newAchievements: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    // 이미 획득한 배지인지 확인
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.code
        }
      }
    })

    if (existing) continue

    // 카테고리별 조건 체크
    let shouldUnlock = false

    switch (achievement.category) {
      case 'learning':
        shouldUnlock = profile.totalWordLearned >= achievement.requirement
        break
      case 'streak':
        shouldUnlock = (streak?.currentStreak || 0) >= achievement.requirement
        break
      case 'accuracy':
        // 최근 10개 퀴즈의 평균 정확도
        const recentAttempts = await prisma.userQuizAttempt.findMany({
          where: { userId },
          orderBy: { attemptedAt: 'desc' },
          take: 10
        })
        if (recentAttempts.length > 0) {
          const accuracy = (recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length) * 100
          shouldUnlock = accuracy >= achievement.requirement
        }
        break
      case 'league':
        shouldUnlock = (league?.tier || 0) >= achievement.requirement
        break
      case 'special':
        // 특별 배지는 수동으로 지급
        break
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, achievement.code)
      newAchievements.push(achievement.code)
    }
  }

  return newAchievements
}

/**
 * 배지 언락
 */
export async function unlockAchievement(userId: string, achievementCode: string) {
  // Achievement 레코드가 없으면 생성
  let achievement = await prisma.achievement.findUnique({
    where: { code: achievementCode }
  })

  if (!achievement) {
    const def = ACHIEVEMENTS.find(a => a.code === achievementCode)
    if (!def) return null

    achievement = await prisma.achievement.create({
      data: {
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        requirement: def.requirement,
      }
    })
  }

  // 유저에게 배지 지급
  const userAchievement = await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
    },
    include: {
      achievement: true
    }
  })

  // 보너스 XP 지급
  await prisma.userProfile.update({
    where: { userId },
    data: {
      totalXP: { increment: 50 }
    }
  })

  return userAchievement
}

/**
 * 유저 배지 목록 조회
 */
export async function getUserAchievements(userId: string) {
  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true
    },
    orderBy: {
      unlockedAt: 'desc'
    }
  })

  return achievements.map(ua => ({
    code: ua.achievement.code,
    name: ua.achievement.name,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    category: ua.achievement.category,
    unlockedAt: ua.unlockedAt,
  }))
}
```

---

### Step 5: 게이미피케이션 API 구현 (7-9일차)

#### 5.1 스트릭 API
`app/api/gamification/streak/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const streak = await prisma.userStreak.findUnique({
      where: { userId: session.user.id }
    })

    if (!streak) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        freezeCount: 0,
      })
    }

    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDate: streak.lastStudyDate,
      freezeCount: streak.freezeCount,
    })
  } catch (error) {
    console.error("Streak fetch error:", error)
    return NextResponse.json(
      { error: "스트릭 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

#### 5.2 리그 랭킹 API
`app/api/gamification/league/ranking/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getLeagueRanking } from "@/lib/gamification/league"

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
    const tier = parseInt(searchParams.get('tier') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const ranking = await getLeagueRanking(tier, limit)

    return NextResponse.json({
      tier,
      ranking,
    })
  } catch (error) {
    console.error("League ranking error:", error)
    return NextResponse.json(
      { error: "랭킹 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

#### 5.3 배지 조회 API
`app/api/gamification/achievements/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserAchievements, ACHIEVEMENTS } from "@/lib/gamification/achievements"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      )
    }

    const unlocked = await getUserAchievements(session.user.id)
    const unlockedCodes = new Set(unlocked.map(a => a.code))

    const all = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedCodes.has(a.code),
      unlockedAt: unlocked.find(u => u.code === a.code)?.unlockedAt || null
    }))

    return NextResponse.json({
      unlocked,
      all,
      totalUnlocked: unlocked.length,
      totalAchievements: ACHIEVEMENTS.length,
    })
  } catch (error) {
    console.error("Achievements fetch error:", error)
    return NextResponse.json(
      { error: "배지 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
```

---

## ✅ 완료 체크리스트

### 데이터베이스
- [ ] Schema 확장 완료
- [ ] 마이그레이션 성공

### 스트릭 시스템
- [ ] 스트릭 업데이트 로직
- [ ] 보호권 시스템
- [ ] 마일스톤 보상

### 리그 시스템
- [ ] 6단계 티어 구현
- [ ] 포인트 시스템
- [ ] 자동 승급
- [ ] 랭킹 조회

### 배지 시스템
- [ ] 20개 배지 정의
- [ ] 자동 언락 로직
- [ ] 배지 조회

### API
- [ ] 스트릭 API
- [ ] 리그 API
- [ ] 배지 API

---

## 🧪 테스트 시나리오

### 스트릭
1. ✅ 연속 학습 시 증가
2. ✅ 하루 건너뛰면 리셋
3. ✅ 보호권 사용
4. ✅ 마일스톤 보상

### 리그
1. ✅ 포인트 획득
2. ✅ 자동 승급
3. ✅ 랭킹 조회

### 배지
1. ✅ 조건 달성 시 언락
2. ✅ 중복 언락 방지
3. ✅ 보너스 XP 지급

---

## 🚀 다음 단계

Phase 1-5 완료 후:
- ✅ Phase 1-6: 대시보드 및 통계
- ✅ 데이터 시각화 구현
