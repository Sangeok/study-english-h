# Phase 1-6: 대시보드 및 통계 시스템

---
doc_type: rfc
status: proposed
owner: "@team"
last_updated: 2026-03-19
target_release: "phase-1-6"
links:
  - issue: "TBD"
    ai_component: none
---

## 문서 정보

- **Phase**: 1-6
- **기간**: 1-1.5주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-2 (퀴즈·진단), Phase 1-3 (SRS), Phase 1-5 (게이미피케이션 백엔드)
- **목표**: 학습 통계 대시보드 + 게이미피케이션 UI 구현

---

## 기술 스택 전제 조건

### 현재 프로젝트 환경 (Phase 1-5 완료 상태)

| 항목 | 기술 | 비고 |
|------|------|------|
| **인증** | Better Auth v1.4 | `getSessionFromRequest(req)` via `shared/lib/get-session.ts` |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` | 커스텀 output: `@/lib/generated/prisma` |
| **DB Import** | `import prisma from "@/lib/db"` | default export |
| **DB** | PostgreSQL (Neon) | 클라우드 |
| **프레임워크** | Next.js 16, React 19 | App Router |
| **아키텍처** | Feature-Sliced Design (FSD) | 계층 구조 적용 |
| **CSS** | Tailwind CSS 4 | PostCSS 사용 |
| **서버 상태** | React Query v5 (`@tanstack/react-query`) | `queryKeys` 팩토리 패턴 |
| **차트** | Recharts ^2.15 (신규 설치) | React 19 호환 확인 필요 |

### 사전 요구사항

- Phase 1-2 완료: `UserProfile` 모델, `getSessionFromRequest()`, 퀴즈·진단 시스템
- Phase 1-3 완료: `FlashcardSession`, `UserVocabulary`, SRS 알고리즘
- Phase 1-5 완료: `UserLeague`, `Achievement`, `UserAchievement` 모델 + 게이미피케이션 백엔드
- **중요**: `UserStreak` 모델은 존재하지 않음. 스트릭 데이터는 `UserProfile.currentStreak`, `longestStreak`, `freezeCount`, `lastStudyDate`, `lastMilestoneGranted` 필드에 저장됨
- **중요**: Phase 1-4 (발음 진단)은 미구현. `PronunciationAttempt` 모델 없음, `pronunciationScore` 필드 없음

### 추가 필요 의존성

```bash
# React 19 호환 확인된 버전 (2.15+)
npm install recharts@^2.15
```

> Zod는 이미 설치되어 있음 (`features/gamification/lib/validation.ts` 등에서 사용 중)

---

## 핵심 설계 원칙

### 1. 기존 코드 재활용

메인 페이지(`views/main/`)에 이미 존재하는 컴포넌트와 API를 최대한 재활용한다:

| 기존 자산 | 위치 | 재활용 방안 |
|---|---|---|
| `StatCard` | `shared/ui/stat-card.tsx` | 대시보드 통계 카드에 그대로 사용 |
| `useProfileStats()` | `views/main/hooks/use-profile-stats.ts` | 대시보드에서 그대로 호출 |
| `GET /api/profile/stats` | `app/api/profile/stats/route.ts` | 프로필 기본 통계 (XP, streak, level 등) |
| `GET /api/profile/recent-activity` | `app/api/profile/recent-activity/route.ts` | 최근 활동 목록 |
| `useStreakDetails()` | `features/gamification/hooks/use-streak-details.ts` | 스트릭 상세 (freeze, milestone) |
| `useLeagueRanking()` | `features/gamification/hooks/use-league-ranking.ts` | 리그 랭킹 데이터 |
| `useAchievements()` | `features/gamification/hooks/use-achievements.ts` | 업적 목록 |
| `useToast()` | `shared/ui/toast.tsx` | 보상 피드백 알림 |
| `LEAGUE_TIERS` | `features/gamification/config/league-tiers.ts` | 티어 이름/아이콘/색상 |
| `STREAK_MILESTONES` | `features/gamification/config/streak-milestones.ts` | 마일스톤 진행도 |
| `queryKeys` | `shared/lib/query-keys.ts` | React Query 캐시 키 (`dashboard` 네임스페이스 추가 필요) |
| `toKSTDateString()` | `entities/user/lib/streak.ts` | KST 기준 날짜 변환 (차트 일별 버킷팅에 사용) |

### 2. 새로 만들 것만 만든다

대시보드에서 **새로 필요한 데이터**는 **기간별 학습 통계** (일별 학습 시간 차트, 카테고리별 분포 차트)와 **현재 유저의 리그 정보** (`GET /api/gamification/league/me`)뿐이다. 나머지는 기존 API로 충분하다.

### 3. FSD + 프로젝트 패턴 준수

- `features/dashboard/` — 차트/통계 전용 슬라이스
- `features/gamification/ui/` — 게이미피케이션 UI 컴포넌트
- React Query 훅 패턴 (useState/useEffect 금지)
- JSX 내 삼항 연산자 금지 (`cn()` + `&&` 사용)
- kebab-case 파일명

---

## Phase 목표

### 핵심 목표

- [ ] 대시보드 페이지 (`/dashboard`) — 기간별 차트 + 통합 통계
- [ ] 게이미피케이션 UI — 업적 갤러리, 리그 리더보드, 스트릭 상세, 리그 진행도
- [ ] 보상 피드백 토스트 — 퀴즈/플래시카드 완료 후 승급·업적·마일스톤 알림

---

## 구현 단계

### Step 0.5: 대시보드 검증 스키마 및 타입

`features/dashboard/lib/validation.ts`:
```typescript
import { z } from "zod";

export const dashboardPeriodSchema = z.object({
  period: z.enum(["day", "week", "month", "all"]).default("week"),
});

export type DashboardPeriodInput = z.infer<typeof dashboardPeriodSchema>;
```

`features/dashboard/types/index.ts`:
```typescript
export interface DailyStudyStat {
  date: string;
  quizCount: number;
  flashcardSessions: number;
  totalStudyTimeSec: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface PeriodStatsResponse {
  totalQuizzes: number;
  quizAccuracy: number;
  totalFlashcardSessions: number;
  totalStudyTimeSec: number;
  dailyStats: DailyStudyStat[];
  categoryStats: CategoryStat[];
}
```

---

### Step 1: 기간별 통계 API (신규)

기존 `/api/profile/stats`는 기본 프로필 통계 (XP, streak, level)를 반환한다. **기간별 집계** (차트용 일별 학습 데이터)는 새 API가 필요하다.

#### 1.1 기간별 통계 API

`app/api/dashboard/period-stats/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import prisma from "@/lib/db";
import { toKSTDateString } from "@/entities/user/lib/streak";
import { dashboardPeriodSchema } from "@/features/dashboard/lib/validation";
import type { PeriodStatsResponse, DailyStudyStat } from "@/features/dashboard/types";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = dashboardPeriodSchema.safeParse({
      period: searchParams.get("period") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "유효하지 않은 기간 파라미터", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const userId = session.user.id;
    const startDate = getStartDate(period);

    // 병렬 조회
    const [quizAttempts, flashcardSessions, vocabularies] = await Promise.all([
      prisma.userQuizAttempt.findMany({
        where: { userId, attemptedAt: { gte: startDate } },
        select: { attemptedAt: true, isCorrect: true, timeSpent: true },
      }),
      prisma.flashcardSession.findMany({
        where: { userId, createdAt: { gte: startDate } },
        select: { createdAt: true, duration: true },
      }),
      prisma.userVocabulary.findMany({
        where: { userId },
        select: { vocabulary: { select: { category: true } } },
      }),
    ]);

    // 퀴즈 통계
    const totalQuizzes = quizAttempts.length;
    const correctCount = quizAttempts.filter((a) => a.isCorrect).length;
    const quizAccuracy = totalQuizzes > 0
      ? Math.round((correctCount / totalQuizzes) * 100)
      : 0;

    // 일별 학습 데이터
    const dailyStats = buildDailyStats(quizAttempts, flashcardSessions, period);

    // 카테고리별 어휘 분포
    const categoryMap: Record<string, number> = {};
    for (const uv of vocabularies) {
      const cat = uv.vocabulary.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const categoryStats = Object.entries(categoryMap).map(
      ([category, count]) => ({ category, count })
    );

    const response: PeriodStatsResponse = {
      totalQuizzes,
      quizAccuracy,
      totalFlashcardSessions: flashcardSessions.length,
      totalStudyTimeSec:
        flashcardSessions.reduce((sum, s) => sum + s.duration, 0) +
        quizAttempts.reduce((sum, a) => sum + a.timeSpent, 0),
      dailyStats,
      categoryStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard period stats error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/** 기간별 조회 시작일 계산. "all"도 90일로 상한 (무한 fetch 방지) */
function getStartDate(period: string): Date {
  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  switch (period) {
    case "day":
      return new Date(now.getTime() - 1 * MS_PER_DAY);
    case "week":
      return new Date(now.getTime() - 7 * MS_PER_DAY);
    case "month":
      return new Date(now.getTime() - 30 * MS_PER_DAY);
    case "all":
      return new Date(now.getTime() - 90 * MS_PER_DAY);
    default:
      return new Date(now.getTime() - 7 * MS_PER_DAY);
  }
}

/** 기간별 차트 일수 */
function getDaysForPeriod(period: string): number {
  switch (period) {
    case "day": return 1;
    case "week": return 7;
    case "month": return 30;
    case "all": return 90;
    default: return 7;
  }
}

/**
 * KST 기준 일별 학습 데이터 집계.
 * streak 시스템과 동일한 타임존(Asia/Seoul)을 사용하여
 * 차트 날짜 라벨과 스트릭 날짜가 일관되도록 한다.
 * toKSTDateString()는 entities/user/lib/streak.ts에서 import.
 */
function buildDailyStats(
  quizAttempts: { attemptedAt: Date; timeSpent: number }[],
  flashcardSessions: { createdAt: Date; duration: number }[],
  period: string
): DailyStudyStat[] {
  const days = getDaysForPeriod(period);

  // 1) 모든 데이터를 KST 날짜별로 미리 그룹화 (O(n) 1회)
  const quizByDate: Record<string, { count: number; time: number }> = {};
  for (const a of quizAttempts) {
    const kstDate = toKSTDateString(a.attemptedAt);
    if (!quizByDate[kstDate]) quizByDate[kstDate] = { count: 0, time: 0 };
    quizByDate[kstDate].count++;
    quizByDate[kstDate].time += a.timeSpent;
  }

  const sessionByDate: Record<string, { count: number; duration: number }> = {};
  for (const s of flashcardSessions) {
    const kstDate = toKSTDateString(s.createdAt);
    if (!sessionByDate[kstDate]) sessionByDate[kstDate] = { count: 0, duration: 0 };
    sessionByDate[kstDate].count++;
    sessionByDate[kstDate].duration += s.duration;
  }

  // 2) 날짜 축 생성 (KST 기준)
  const stats: DailyStudyStat[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = toKSTDateString(date);

    const quiz = quizByDate[dateStr];
    const session = sessionByDate[dateStr];

    stats.push({
      date: dateStr,
      quizCount: quiz?.count ?? 0,
      flashcardSessions: session?.count ?? 0,
      totalStudyTimeSec: (quiz?.time ?? 0) + (session?.duration ?? 0),
    });
  }

  return stats;
}
```

> **기존 API 재활용**: `/api/profile/stats` (프로필 통계), `/api/profile/recent-activity` (최근 활동), `/api/gamification/streak` (스트릭 상세), `/api/gamification/league/ranking` (랭킹), `/api/gamification/achievements` (업적) — 이들은 새로 만들지 않고 기존 훅으로 호출한다.

#### 1.2 내 리그 정보 API (신규)

기존 `/api/gamification/league/ranking`은 특정 티어의 랭킹 목록만 반환하고, 현재 유저의 tier/points를 직접 반환하는 API가 없다. `LeagueProgress` 컴포넌트에 실데이터를 공급하기 위해 신규 엔드포인트를 추가한다.

`app/api/gamification/league/me/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/get-session";
import prisma from "@/lib/db";

/**
 * GET /api/gamification/league/me
 * 현재 로그인 유저의 리그 정보 (tier, points) 반환
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const league = await prisma.userLeague.findUnique({
    where: { userId: session.user.id },
    select: { tier: true, leaguePoints: true },
  });

  return NextResponse.json({
    tier: league?.tier ?? 1,
    leaguePoints: league?.leaguePoints ?? 0,
  });
}
```

`features/gamification/api/gamification-api.ts`에 fetch 함수 추가:
```typescript
export async function fetchMyLeague(): Promise<{ tier: number; leaguePoints: number }> {
  const res = await fetch("/api/gamification/league/me");
  if (!res.ok) throw new Error("Failed to fetch my league");
  return res.json();
}
```

`features/gamification/hooks/use-my-league.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchMyLeague } from "../api/gamification-api";
import { queryKeys } from "@/shared/lib/query-keys";

export function useMyLeague() {
  return useQuery({
    queryKey: queryKeys.gamification.league(),
    queryFn: fetchMyLeague,
  });
}
```

---

### Step 2: 대시보드 훅

`features/dashboard/hooks/use-period-stats.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import type { PeriodStatsResponse } from "../types";

async function fetchPeriodStats(period: string): Promise<PeriodStatsResponse> {
  const res = await fetch(`/api/dashboard/period-stats?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch period stats");
  return res.json();
}

export function usePeriodStats(period: string = "week") {
  return useQuery({
    queryKey: queryKeys.dashboard.periodStats(period),
    queryFn: () => fetchPeriodStats(period),
    staleTime: 1000 * 60 * 5,
  });
}
```

> **필수 사전 작업**: `shared/lib/query-keys.ts`에 `dashboard` 네임스페이스 추가:
> ```typescript
> dashboard: {
>   all: ["dashboard"] as const,
>   periodStats: (period: string) =>
>     [...queryKeys.dashboard.all, "period-stats", period] as const,
> },
> ```

---

### Step 3: 게이미피케이션 UI 컴포넌트 (신규)

Phase 1-5에서 구현된 백엔드 기능에 대응하는 UI. 모두 `features/gamification/ui/`에 배치한다.

#### 3.1 업적 갤러리

`features/gamification/ui/achievement-gallery.tsx`:

- 전체 업적을 그리드로 표시 (해제/잠금 상태 구분)
- `useAchievements()` 훅 사용 → `GET /api/gamification/achievements`
- 카테고리별 필터 (learning, streak, accuracy, league, special)
- 잠금 업적은 반투명 + 자물쇠 아이콘
- 해제 업적은 해제 일시 표시

```typescript
"use client";

import { useState } from "react";
import { useAchievements } from "../hooks/use-achievements";
import { cn } from "@/lib/utils";
import type { AchievementResponse } from "../types";

const CATEGORIES = ["all", "learning", "streak", "accuracy", "league", "special"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: "전체",
  learning: "학습",
  streak: "연속 학습",
  accuracy: "정확도",
  league: "리그",
  special: "특별",
};

export function AchievementGallery() {
  const { data, isLoading } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (isLoading) {
    return <AchievementGallerySkeleton />;
  }

  if (!data) return null;

  const filtered = selectedCategory === "all"
    ? data.all
    : data.all.filter((a) => a.category === selectedCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-purple-950">
          업적 ({data.totalUnlocked}/{data.totalAchievements})
        </h3>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat && "bg-purple-600 text-white",
              selectedCategory !== cat && "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 업적 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((achievement) => (
          <AchievementCard key={achievement.code} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementResponse }) {
  const isUnlocked = achievement.unlocked;
  const displayIcon = isUnlocked ? achievement.icon : "🔒";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 text-center transition-all",
        isUnlocked && "bg-white shadow-md",
        !isUnlocked && "bg-gray-100 opacity-60"
      )}
    >
      <div className="text-4xl mb-3">{displayIcon}</div>
      <p className="font-semibold text-sm text-purple-950 mb-1">
        {achievement.name}
      </p>
      <p className="text-xs text-gray-500">
        {achievement.description}
      </p>
      {isUnlocked && achievement.unlockedAt && (
        <p className="text-xs text-purple-600 mt-2">
          {new Date(achievement.unlockedAt).toLocaleDateString("ko-KR")}
        </p>
      )}
    </div>
  );
}

function AchievementGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 bg-gray-100 animate-pulse h-32" />
      ))}
    </div>
  );
}
```

#### 3.2 리그 리더보드

`features/gamification/ui/league-leaderboard.tsx`:

- 현재 티어의 랭킹 표시
- `useLeagueRanking(tier, limit)` 훅 사용 → `GET /api/gamification/league/ranking`
- 티어 탭 선택 가능 (`LEAGUE_TIERS` config 활용)
- 현재 사용자 행 하이라이트

```typescript
"use client";

import { useState } from "react";
import { useLeagueRanking } from "../hooks/use-league-ranking";
import { LEAGUE_TIERS } from "../config/league-tiers";
import { cn } from "@/lib/utils";

export function LeagueLeaderboard() {
  const [selectedTier, setSelectedTier] = useState(1);
  const { data, isLoading } = useLeagueRanking(selectedTier, 10);

  return (
    <div>
      <h3 className="text-2xl font-bold text-purple-950 mb-6">리그 랭킹</h3>

      {/* 티어 선택 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {LEAGUE_TIERS.map((tier) => (
          <button
            key={tier.tier}
            onClick={() => setSelectedTier(tier.tier)}
            className={cn(
              "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedTier === tier.tier && "bg-purple-600 text-white",
              selectedTier !== tier.tier && "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            <span>{tier.icon}</span>
            <span>{tier.nameKo}</span>
          </button>
        ))}
      </div>

      {/* 랭킹 목록 */}
      {isLoading && <LeaderboardSkeleton />}
      {!isLoading && data && (
        <div className="space-y-2">
          {data.ranking.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-purple-600 w-8">
                  {entry.rank}
                </span>
                <span className="font-medium text-purple-950">
                  {entry.nickname}
                </span>
              </div>
              <span className="font-semibold text-purple-700">
                {entry.points.toLocaleString()} P
              </span>
            </div>
          ))}
          {data.ranking.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              아직 이 티어에 참가자가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );
}
```

#### 3.3 스트릭 상세 카드

`features/gamification/ui/streak-detail-card.tsx`:

- freeze 보유 수량 표시
- 마일스톤 진행도 (7→14→30→100일) 시각화
- `useStreakDetails()` 훅 사용 → `GET /api/gamification/streak`
- `STREAK_MILESTONES` config 활용

```typescript
"use client";

import { useStreakDetails } from "../hooks/use-streak-details";
import { STREAK_MILESTONES } from "../config/streak-milestones";
import { cn } from "@/lib/utils";

export function StreakDetailCard() {
  const { data, isLoading } = useStreakDetails();

  if (isLoading) {
    return <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-purple-950">연속 학습</h3>
          <p className="text-4xl font-bold text-purple-600 mt-1">
            {data.currentStreak}일
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">최장 기록</p>
          <p className="text-lg font-semibold text-purple-800">
            {data.longestStreak}일
          </p>
        </div>
      </div>

      {/* Freeze 보유 */}
      <div className="flex items-center gap-2 mb-6 bg-blue-50 rounded-xl px-4 py-3">
        <span className="text-xl">🧊</span>
        <span className="text-sm text-blue-800">
          스트릭 보호권 <strong>{data.freezeCount}개</strong> 보유
        </span>
      </div>

      {/* 마일스톤 진행도 */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-3">마일스톤</p>
        <div className="space-y-3">
          {STREAK_MILESTONES.map((milestone) => {
            const achieved = data.currentStreak >= milestone.days;
            const progress = Math.min(
              (data.currentStreak / milestone.days) * 100,
              100
            );

            return (
              <div key={milestone.days} className="flex items-center gap-3">
                <span className={cn(
                  "text-sm font-medium w-12",
                  achieved && "text-purple-600",
                  !achieved && "text-gray-400"
                )}>
                  {milestone.days}일
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      achieved && "bg-purple-600",
                      !achieved && "bg-purple-300"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  +{milestone.xpReward}XP, {milestone.freezeReward}🧊
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

#### 3.4 리그 티어 진행도

`features/gamification/ui/league-progress.tsx`:

- 현재 포인트 → 다음 티어까지 프로그레스 바
- `LEAGUE_TIERS` config 기반 계산

```typescript
"use client";

import { LEAGUE_TIERS } from "../config/league-tiers";
import type { LeagueTier } from "../config/league-tiers";
import { cn } from "@/lib/utils";

interface LeagueProgressProps {
  currentTier: number;
  currentPoints: number;
}

export function LeagueProgress({ currentTier, currentPoints }: LeagueProgressProps) {
  const tier = LEAGUE_TIERS.find((t) => t.tier === currentTier);
  const nextTier = LEAGUE_TIERS.find((t) => t.tier === currentTier + 1);

  if (!tier) return null;

  const isMaxTier = !nextTier;
  const progressPercent = getProgressPercent(currentPoints, tier, nextTier);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{tier.icon}</span>
        <div>
          <p className="font-bold text-purple-950">{tier.nameKo}</p>
          <p className="text-sm text-gray-500">
            {currentPoints.toLocaleString()} 포인트
          </p>
        </div>
      </div>

      {!isMaxTier && nextTier && (
        <>
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: tier.color,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            다음 티어: {nextTier.icon} {nextTier.nameKo} ({nextTier.minPoints.toLocaleString()}P)
          </p>
        </>
      )}

      {isMaxTier && (
        <p className="text-sm text-purple-600 font-semibold">
          최고 티어 달성!
        </p>
      )}
    </div>
  );
}

function getProgressPercent(
  points: number,
  current: LeagueTier,
  next: LeagueTier | undefined
): number {
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  if (range <= 0) return 100;
  const progress = points - current.minPoints;
  return Math.min(Math.round((progress / range) * 100), 100);
}
```

#### 3.5 보상 피드백 토스트

`features/gamification/ui/reward-toast.tsx`:

퀴즈/플래시카드 완료 후 API 응답에 포함된 `gamification` 결과를 토스트로 표시한다. 기존 `useToast()` 시스템을 활용한다.

```typescript
import { useToast } from "@/shared/ui/toast";
import { ACHIEVEMENTS } from "../config/achievements";
import type { GamificationResult } from "../types";

/**
 * gamification 결과를 토스트 메시지로 변환하여 표시하는 유틸 훅
 */
export function useRewardToast() {
  const { toast } = useToast();

  function showRewards(result: GamificationResult) {
    // 리그 승급
    if (result.promoted && result.newTierName) {
      toast(`🎉 ${result.newTierName} 리그로 승급했습니다!`, {
        variant: "success",
        duration: 5000,
      });
    }

    // 리그 포인트 획득
    if (result.leaguePoints > 0 && !result.promoted) {
      toast(`⚡ +${result.leaguePoints} 리그 포인트`, { variant: "info" });
    }

    // 마일스톤 달성
    for (const milestone of result.milestones) {
      toast(
        `🔥 ${milestone.milestone}일 연속 학습 달성! +${milestone.xpReward}XP`,
        { variant: "success", duration: 5000 }
      );
    }

    // 새 업적 해제 (newAchievements는 achievement code 문자열 배열)
    for (const code of result.newAchievements) {
      const definition = ACHIEVEMENTS.find((a) => a.code === code);
      const displayName = definition?.name ?? code;
      toast(`🏆 업적 해제: ${displayName}`, {
        variant: "success",
        duration: 5000,
      });
    }
  }

  return { showRewards };
}
```

> **통합 지점**: 퀴즈 결과 페이지, 플래시카드 결과 페이지에서 `showRewards(response.gamification)`을 호출한다. 현재 `app/api/quiz/submit/route.ts`와 `app/api/flashcard/review/route.ts`가 이미 `gamification` 필드를 응답에 포함하고 있다.

---

### Step 4: 대시보드 페이지

`app/(shell)/dashboard/page.tsx`:

기존 API + 새 기간별 통계 API를 조합한다.

```typescript
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useProfileStats } from "@/views/main/hooks/use-profile-stats";
import { usePeriodStats } from "@/features/dashboard/hooks/use-period-stats";
import { useMyLeague } from "@/features/gamification/hooks/use-my-league";
import { StatCard } from "@/shared/ui";
import { StreakDetailCard } from "@/features/gamification/ui/streak-detail-card";
import { LeagueProgress } from "@/features/gamification/ui/league-progress";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
  { value: "all", label: "전체" },
] as const;

const PIE_COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

const CATEGORY_LABELS: Record<string, string> = {
  daily: "일상",
  business: "비즈니스",
  toeic: "토익",
  travel: "여행",
  idioms: "숙어",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState("week");
  const profileQuery = useProfileStats();
  const periodQuery = usePeriodStats(period);
  const leagueQuery = useMyLeague();

  const profile = profileQuery.data;
  const periodStats = periodQuery.data;
  const league = leagueQuery.data;
  const isLoading = profileQuery.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-950 mb-2">대시보드</h1>
          <p className="text-purple-800/70">학습 진행 상황을 한눈에 확인하세요</p>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="⭐"
            label="총 경험치"
            value={profile?.totalXP.toLocaleString() ?? "0"}
            gradient="purple"
            isLoading={isLoading}
            footer={
              <p className="text-sm text-purple-600 font-medium">
                레벨: {profile?.level ?? "A1"}
              </p>
            }
          />
          <StatCard
            icon="🔥"
            label="연속 학습"
            value={`${profile?.streak ?? 0}일`}
            gradient="violet"
            isLoading={isLoading}
            footer={
              <p className="text-sm text-purple-600">
                최장: {profile?.longestStreak ?? 0}일
              </p>
            }
          />
          <StatCard
            icon="📚"
            label="학습 단어"
            value={String(profile?.totalWordLearned ?? 0)}
            gradient="indigo"
            isLoading={isLoading}
            footer={
              <p className="text-sm text-purple-600">
                마스터: {profile?.masteredWords ?? 0}개
              </p>
            }
          />
        </div>

        {/* 게이미피케이션 요약: 스트릭 상세 + 리그 진행도 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StreakDetailCard />
          <LeagueProgress
            currentTier={league?.tier ?? 1}
            currentPoints={league?.leaguePoints ?? 0}
          />
        </div>

        {/* 복습 필요 알림 */}
        {profile && profile.reviewNeeded > 0 && (
          <ReviewNeededBanner count={profile.reviewNeeded} />
        )}

        {/* 기간 선택 */}
        <div className="flex gap-2 mb-6">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                period === opt.value && "bg-purple-600 text-white",
                period !== opt.value && "bg-purple-100 text-purple-700 hover:bg-purple-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 차트 영역 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 일별 학습 시간 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-950 mb-4">일별 학습 시간</h3>
            {periodQuery.isLoading && (
              <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse" />
            )}
            {periodStats && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={periodStats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.split("-")[2]}
                  />
                  <YAxis
                    label={{ value: "분", angle: -90, position: "insideLeft" }}
                    tickFormatter={(v: number) => String(Math.round(v / 60))}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value / 60)}분`, "학습 시간"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalStudyTimeSec"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="학습 시간"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 카테고리별 학습 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-950 mb-4">카테고리별 학습</h3>
            {periodQuery.isLoading && (
              <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse" />
            )}
            {periodStats && periodStats.categoryStats.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={periodStats.categoryStats.map((c) => ({
                      ...c,
                      label: CATEGORY_LABELS[c.category] ?? c.category,
                    }))}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {periodStats.categoryStats.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            {periodStats && periodStats.categoryStats.length === 0 && (
              <p className="text-center text-gray-500 py-16">
                아직 학습한 어휘가 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 학습 통계 요약 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-950 mb-4">퀴즈 통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">완료한 퀴즈</span>
                <span className="font-bold">{periodStats?.totalQuizzes ?? 0}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">정확도</span>
                <span className="font-bold text-green-600">
                  {periodStats?.quizAccuracy ?? 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-950 mb-4">플래시카드 통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학습 세션</span>
                <span className="font-bold">
                  {periodStats?.totalFlashcardSessions ?? 0}회
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 학습 시간</span>
                <span className="font-bold">
                  {Math.round((periodStats?.totalStudyTimeSec ?? 0) / 60)}분
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewNeededBanner({ count }: { count: number }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-yellow-800 mb-1">
            복습이 필요한 단어가 {count}개 있습니다
          </h3>
          <p className="text-sm text-yellow-700">
            지금 복습하고 기억을 강화하세요!
          </p>
        </div>
        <a
          href="/flashcard/modes"
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          복습 시작
        </a>
      </div>
    </div>
  );
}
```

> **발음 통계 섹션은 제거**: Phase 1-4 (발음 진단)이 미구현 상태이며 `PronunciationAttempt` 모델도 없으므로, 발음 관련 통계를 표시하지 않는다. Phase 1-4 구현 후 추가한다.

---

### Step 5: 게이미피케이션 전용 페이지 (선택)

업적 갤러리와 리그 리더보드는 별도 페이지로 제공할 수 있다.

`app/(shell)/achievements/page.tsx`:
```typescript
"use client";

import { AchievementGallery } from "@/features/gamification/ui/achievement-gallery";

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <AchievementGallery />
      </div>
    </div>
  );
}
```

`app/(shell)/league/page.tsx`:
```typescript
"use client";

import { LeagueLeaderboard } from "@/features/gamification/ui/league-leaderboard";

export default function LeaguePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <LeagueLeaderboard />
      </div>
    </div>
  );
}
```

---

## FSD 디렉토리 구조

Phase 1-6에서 생성/수정할 FSD 기반 디렉토리:

```
features/gamification/ui/              # 게이미피케이션 UI (신규)
├── achievement-gallery.tsx
├── league-leaderboard.tsx
├── league-progress.tsx
├── streak-detail-card.tsx
└── reward-toast.tsx

features/gamification/hooks/            # 기존 디렉토리에 추가
└── use-my-league.ts                   # 내 리그 정보 훅 (신규)

features/dashboard/                    # 대시보드 전용 슬라이스 (신규)
├── hooks/
│   └── use-period-stats.ts
├── lib/
│   └── validation.ts
├── types/
│   └── index.ts
└── index.ts

app/api/dashboard/
└── period-stats/
    └── route.ts                       # 기간별 통계 API (신규)

app/api/gamification/league/
└── me/
    └── route.ts                       # 내 리그 정보 API (신규)

app/(shell)/dashboard/
└── page.tsx                           # 대시보드 페이지 (신규)

app/(shell)/achievements/
└── page.tsx                           # 업적 갤러리 페이지 (선택)

app/(shell)/league/
└── page.tsx                           # 리그 리더보드 페이지 (선택)
```

> **재활용 (수정 불필요)**:
> - `shared/ui/stat-card.tsx` — 통계 카드 컴포넌트
> - `shared/ui/toast.tsx` — 토스트 시스템
> - `features/gamification/hooks/` — 기존 게이미피케이션 훅 3개
> - `features/gamification/config/` — 리그/마일스톤/업적 설정
> - `entities/user/lib/streak.ts` — `toKSTDateString()` 유틸
> - `app/api/profile/stats/route.ts` — 프로필 기본 통계
> - `app/api/profile/recent-activity/route.ts` — 최근 활동
> - `app/api/gamification/*/route.ts` — 게이미피케이션 API 3개
>
> **재활용 (소규모 수정 필요)**:
> - `shared/lib/query-keys.ts` — `dashboard` 네임스페이스 추가
> - `features/gamification/api/gamification-api.ts` — `fetchMyLeague()` 함수 추가

---

## 완료 체크리스트

### 사전 작업
- [ ] Recharts 설치 (`npm install recharts@^2.15`)
- [ ] Phase 1-5 완료 확인 (게이미피케이션 백엔드, 업적 시드 데이터)
- [ ] `shared/lib/query-keys.ts`에 `dashboard` 네임스페이스 추가

### API
- [ ] 기간별 통계 API (`GET /api/dashboard/period-stats`)
- [ ] 내 리그 정보 API (`GET /api/gamification/league/me`)
- [ ] `fetchMyLeague()` 함수 + `useMyLeague()` 훅 추가
- [ ] Zod 검증 (period 파라미터)
- [ ] 기존 API 동작 확인 (`/api/profile/stats`, `/api/gamification/*`)

### 게이미피케이션 UI
- [ ] 업적 갤러리 (`features/gamification/ui/achievement-gallery.tsx`)
- [ ] 리그 리더보드 (`features/gamification/ui/league-leaderboard.tsx`)
- [ ] 리그 진행도 (`features/gamification/ui/league-progress.tsx`)
- [ ] 스트릭 상세 카드 (`features/gamification/ui/streak-detail-card.tsx`)
- [ ] 보상 피드백 토스트 (`features/gamification/ui/reward-toast.tsx`)

### 대시보드 페이지
- [ ] 대시보드 페이지 (`app/(shell)/dashboard/page.tsx`)
- [ ] 주요 통계 카드 (XP, 스트릭, 학습 단어) — `StatCard` 재활용
- [ ] 기간 선택 (day/week/month/all)
- [ ] 일별 학습 시간 차트 (Recharts Line)
- [ ] 카테고리별 분포 차트 (Recharts Pie)
- [ ] 퀴즈/플래시카드 통계 요약
- [ ] 복습 필요 알림 배너

### 선택 페이지
- [ ] 업적 갤러리 페이지 (`app/(shell)/achievements/page.tsx`)
- [ ] 리그 리더보드 페이지 (`app/(shell)/league/page.tsx`)

### 보상 피드백 통합
- [ ] 퀴즈 결과 화면에서 `useRewardToast()` 연동
- [ ] 플래시카드 결과 화면에서 `useRewardToast()` 연동

---

## 테스트 시나리오

### 기간별 통계 API
1. [ ] 기간별 데이터 정확성 (day/week/month/all 파라미터)
2. [ ] Zod 검증 (잘못된 period 값 → 400)
3. [ ] 빈 데이터 처리 (신규 사용자 → 0값)
4. [ ] 인증 필요 (미인증 → 401)

### 게이미피케이션 UI
1. [ ] 업적 갤러리: 카테고리 필터 동작, 잠금/해제 상태 표시
2. [ ] 리그 리더보드: 티어 탭 전환, 랭킹 정렬
3. [ ] 스트릭 상세: freeze 수량, 마일스톤 진행도
4. [ ] 리그 진행도: 현재/다음 티어 프로그레스 바
5. [ ] 보상 토스트: 승급·업적·마일스톤 알림 표시

### 대시보드 UI
1. [ ] 차트 렌더링 (Recharts Line/Pie)
2. [ ] 반응형 (모바일/태블릿/데스크톱)
3. [ ] 로딩 스켈레톤 표시
4. [ ] 기간 전환 시 차트 갱신

---

## 기존 문서 대비 변경사항

| 항목 | 이전 | 변경 후 |
|------|------|---------|
| `prisma.userStreak` | `UserStreak` 모델 사용 | `UserProfile`의 streak 필드 사용 |
| `pronunciationScore` | 발음 통계 섹션 포함 | 제거 (Phase 1-4 미구현) |
| `PronunciationAttempt` | 전제 | 제거 |
| 파일 경로 | `lib/dashboard/`, `app/dashboard/` | `features/dashboard/`, `app/(shell)/dashboard/` |
| 데이터 fetching | `useState` + `useEffect` | React Query 훅 |
| 타입 정의 | 인라인 `interface` | `features/dashboard/types/index.ts` |
| 기존 API | 무시하고 새로 구현 | `/api/profile/stats` 등 재활용 |
| 게이미피케이션 UI | 없음 | 업적/리그/스트릭/보상 UI 5개 추가 |
| JSX 삼항 | 사용 | `cn()` + `&&` 패턴으로 변경 |
| 발음 연습 버튼 | 빠른 시작에 포함 | 제거 (미구현) |
| 날짜 계산 | UTC (`toISOString`) | KST (`toKSTDateString`) — 스트릭 시스템과 일관성 |
| "all" 기간 | `new Date(0)` 무한 fetch | 90일 상한으로 제한 |
| `queryKeys` | 미사용 (인라인 리터럴) | `queryKeys.dashboard.periodStats()` 팩토리 패턴 |
| 유저 리그 데이터 | API 없음 (하드코딩) | `GET /api/gamification/league/me` 신규 API |

---

## 다음 단계

Phase 1-6 완료 후:
- Phase 1 전체 통합 테스트
- 메인 페이지(`views/main/`)에서 대시보드/게이미피케이션 페이지 링크 추가
- Phase 1-4 (발음 진단) 구현 시 대시보드에 발음 통계 섹션 추가

### Phase 2 고도화 방향 (참고)
- 실시간 학습 통계 업데이트 (WebSocket)
- 고급 차트 (Bar Chart, Area Chart, Radar Chart)
- 학습 목표 설정 및 추적
- 친구 비교 및 소셜 기능
- 일일/주간 학습 리포트 (이메일 발송)

---

## 변경 이력

| 일자 | 변경 내용 |
|------|-----------|
| 2026-01-30 | 초안 작성 |
| 2026-03-19 | 전면 재작성: 실제 스키마 기반으로 수정, 게이미피케이션 UI 추가, FSD·React Query 패턴 적용, 기존 API/컴포넌트 재활용 방안 명시 |
| 2026-03-19 | 코드베이스 검증 반영: (1) `buildDailyStats` UTC→KST 타임존 수정 (2) "all" 기간 무한 fetch 제거 (90일 상한) (3) `queryKeys.dashboard` 네임스페이스 추가 (4) `GET /api/gamification/league/me` 신규 API + `useMyLeague()` 훅 추가로 `LeagueProgress` 하드코딩 해소 |
