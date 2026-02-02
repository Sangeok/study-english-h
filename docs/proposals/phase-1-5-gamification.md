# Phase 1-5: 게이미피케이션 시스템

## 📋 문서 정보
- **Phase**: 1-5
- **기간**: 1.5-2주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-2, 1-3, 1-4
- **목표**: 스트릭, 리그, 배지 시스템으로 학습 동기부여 극대화

---

## ⚠️ 기술 스택 전제 조건

### 현재 프로젝트 환경 (Phase 1-4 완료 상태)
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
- Phase 1-3 완료: 어휘 학습 시스템
- Phase 1-4 완료: 발음 진단 시스템
- Better Auth 인증 시스템 정상 동작
- PostgreSQL (Neon Cloud) 데이터베이스 연결 정상

---

## 🎯 Phase 목표

### 핵심 목표
- [ ] 일일 스트릭 시스템 (연속 학습일 추적)
- [ ] 글로벌 리그 시스템 (6단계: Bronze ~ Master)
- [ ] 기본 배지 시스템 (20개)
- [ ] XP 포인트 시스템
- [ ] 스트릭 보호권 기능

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
  updatedAt       DateTime @updatedAt

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

// User 모델에 관계 추가 (Phase 1-1에서 생성됨, Phase 1-5 관계만 추가)
model User {
  // ... 기존 필드들 (Phase 1-1)

  // Phase 1-5 추가
  league          UserLeague?
  streak          UserStreak?
  achievements    UserAchievement[]
}

// UserProfile 모델 확장 (Phase 1-2에서 생성됨, Phase 1-5 필드만 추가)
model UserProfile {
  // ... 기존 필드들 (Phase 1-2)

  // Phase 1-5 추가 필드 - 일일 목표
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

### Step 1.5: Zod 검증 스키마 구현

#### 1.5.1 게이미피케이션 검증 스키마
`lib/gamification/validation.ts`:
```typescript
import { z } from "zod"

/**
 * 스트릭 보호권 부여 스키마
 */
export const streakFreezeSchema = z.object({
  count: z.number().int().min(1).max(10).optional().default(1),
})

export type StreakFreezeInput = z.infer<typeof streakFreezeSchema>

/**
 * 리그 포인트 추가 스키마
 */
export const leaguePointsSchema = z.object({
  points: z.number().int().min(1).max(1000),
})

export type LeaguePointsInput = z.infer<typeof leaguePointsSchema>

/**
 * 리그 랭킹 조회 스키마
 */
export const leagueRankingSchema = z.object({
  tier: z.coerce.number().int().min(1).max(6).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

export type LeagueRankingInput = z.infer<typeof leagueRankingSchema>

/**
 * 배지 언락 스키마
 */
export const achievementUnlockSchema = z.object({
  achievementCode: z.string().min(1).max(50),
})

export type AchievementUnlockInput = z.infer<typeof achievementUnlockSchema>
```

---

### Step 2: 스트릭 시스템 구현 (2-3일차)

#### 2.1 스트릭 관리 서비스
`lib/gamification/streak.ts`:
```typescript
import prisma from "@/lib/db"

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
import prisma from "@/lib/db"

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
import prisma from "@/lib/db"

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
 * ⚠️ 구현 참고:
 * - Achievement.code는 unique string이지만 Primary Key(id)와는 별도
 * - UserAchievement는 Achievement.id를 참조하므로 code→id 변환 필요
 * - 위 checkAchievements()는 간소화된 예시이며, 실제로는 unlockAchievement() 내부에서 ID 변환 처리
 */

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
import { getSessionFromRequest } from "@/shared/lib/get-session"
import prisma from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

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
import { getSessionFromRequest } from "@/shared/lib/get-session"
import { getLeagueRanking } from "@/lib/gamification/league"

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
import { getSessionFromRequest } from "@/shared/lib/get-session"
import { getUserAchievements, ACHIEVEMENTS } from "@/lib/gamification/achievements"

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)

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

## 📁 FSD 디렉토리 구조

Phase 1-5에서 생성할 FSD 기반 디렉토리:

```
study-eng-h/
├── app/
│   └── api/
│       └── gamification/
│           ├── streak/
│           │   └── route.ts             # 스트릭 조회 API
│           ├── league/
│           │   └── ranking/
│           │       └── route.ts         # 리그 랭킹 API
│           └── achievements/
│               └── route.ts             # 배지 조회 API
├── lib/
│   └── gamification/
│       ├── streak.ts                    # 스트릭 관리 로직
│       ├── league.ts                    # 리그 시스템 로직
│       ├── achievements.ts              # 배지 시스템 로직
│       └── validation.ts                # Zod 검증 스키마
└── prisma/
    └── schema.prisma                    # 게이미피케이션 모델 추가
```

> **참고**: `shared/lib/get-session.ts` (세션 헬퍼)는 Phase 1-2에서 생성됨.

---

## ✅ 완료 체크리스트

### 사전 작업
- [ ] Phase 1-2 완료 확인 (UserProfile, 세션 헬퍼)
- [ ] Phase 1-3 완료 확인 (어휘 시스템)
- [ ] Phase 1-4 완료 확인 (발음 진단 시스템)

### 데이터베이스
- [ ] Schema 확장 완료 (UserLeague, UserStreak, Achievement, UserAchievement)
- [ ] User, UserProfile 관계 추가
- [ ] 마이그레이션 성공

### 검증
- [ ] Zod 검증 스키마 구현 (validation.ts)

### 스트릭 시스템
- [ ] 스트릭 업데이트 로직 (`updateStreak()`)
- [ ] 보호권 시스템 (`grantStreakFreeze()`)
- [ ] 마일스톤 보상 (`checkStreakMilestones()`)
- [ ] 연속/최장 스트릭 추적

### 리그 시스템
- [ ] 6단계 티어 구현 (Bronze ~ Master)
- [ ] 포인트 시스템 (`addLeaguePoints()`)
- [ ] 자동 승급 (티어 계산)
- [ ] 랭킹 조회 (`getLeagueRanking()`)
- [ ] 포인트 획득 이벤트 정의

### 배지 시스템
- [ ] 20개 배지 정의 (ACHIEVEMENTS 배열)
- [ ] 자동 언락 로직 (`checkAchievements()`)
- [ ] 배지 조회 (`getUserAchievements()`)
- [ ] 보너스 XP 지급

### API
- [ ] 스트릭 조회 API (`GET /api/gamification/streak`)
- [ ] 리그 랭킹 API (`GET /api/gamification/league/ranking`)
- [ ] 배지 조회 API (`GET /api/gamification/achievements`)

---

## 🧪 테스트 시나리오

### 스트릭
1. [ ] 연속 학습 시 스트릭 증가 (1일 → 2일 → 3일...)
2. [ ] 하루 건너뛰면 스트릭 리셋 (보호권 없을 때)
3. [ ] 보호권 사용 (건너뛰어도 스트릭 유지, freezeCount 감소)
4. [ ] 마일스톤 보상 (7일: XP +50 & 보호권 +1)
5. [ ] 최장 스트릭 기록 업데이트

### 리그
1. [ ] 레슨 완료 시 포인트 획득 (100pt)
2. [ ] 자동 승급 (1000pt 도달 시 Bronze → Silver)
3. [ ] 티어별 랭킹 조회 (상위 10명)
4. [ ] 포인트 계산 정확성 (perfect score: 150pt)

### 배지
1. [ ] 조건 달성 시 자동 언락 (vocab_10: 10개 학습 시)
2. [ ] 중복 언락 방지 (이미 획득한 배지 체크)
3. [ ] 보너스 XP 지급 (배지당 +50 XP)
4. [ ] 카테고리별 배지 달성 확인 (learning, streak, league)

### Zod 검증
1. [ ] 리그 포인트 유효성 (1-1000 범위)
2. [ ] 티어 범위 검증 (1-6)
3. [ ] 잘못된 입력 거부 (400 에러)

---

## 🚀 다음 단계

Phase 1-5 완료 후:
- Phase 1-6: 대시보드 및 통계
  - 학습 진도 시각화
  - 스트릭/리그/배지 통합 대시보드
  - 데이터 차트 및 그래프 구현

### Phase 2 게이미피케이션 고도화 방향 (참고)
- 소셜 기능 (친구 추가, 경쟁, 협력)
- 주간/월간 챌린지 시스템
- 커스텀 배지 및 프로필 꾸미기
- 리그 시즌 시스템 (매달 리셋)
- 보상 상점 (XP로 아이템 구매)

---

## 📝 변경 이력

| 일자 | 변경 내용 |
|------|-----------|
| 2026-01-30 | 초안 작성 |
| 2026-01-30 | 기술 스택 전제 조건 테이블 추가 |
| 2026-01-30 | 사전 요구사항 섹션 추가 |
| 2026-01-30 | NextAuth → Better Auth 전환 반영 (`getSessionFromRequest`) |
| 2026-01-30 | Prisma import 방식 수정 (default export) |
| 2026-01-30 | Zod 검증 스키마 추가 (Step 1.5) |
| 2026-01-30 | FSD 디렉토리 구조 섹션 추가 |
| 2026-01-30 | Achievement 모델에 `updatedAt` 추가 |
| 2026-01-30 | User/UserProfile 모델 주석 개선 (Phase 참조) |
| 2026-01-30 | 체크리스트/테스트 시나리오 표기 통일 (`[ ]`) |
| 2026-01-30 | 테스트 시나리오 구체화 (예상 값 포함) |
| 2026-01-30 | Phase 2 게이미피케이션 고도화 방향 추가 |
