# Phase 1-3: 어휘 학습 및 SRS 시스템

## 문서 정보

- **Phase**: 1-3
- **기간**: 1.5-2주
- **우선순위**: P1 (필수)
- **의존성**: Phase 1-2 (퀴즈 시스템), UserProfile 모델 사전 구현 필요
- **목표**: 플래시카드 기반 어휘 학습 및 Spaced Repetition System 구현
- **인증**: Better-Auth (Kakao OAuth) - 서버 사이드 세션 검증
- **현재 상태**: ✅ 핵심 구현 완료 (2026-03-18 기준)
  - ✅ 데이터베이스 스키마 추가 완료
  - ✅ SRS 알고리즘 구현 완료
  - ✅ Flashcard API 구현 완료
  - ✅ 어휘 데이터 1340+ 개 추가 (목표 1000개 초과 달성)
  - ✅ Flashcard UI 구현 완료 (FSD 구조)
  - ✅ 학습 결과 페이지, 모드 선택 페이지 완료
  - ✅ XP/스트릭 시스템 연동 완료
  - ⏸️ 추가 학습 모드 4종 (매칭/선택/타이핑/듣기) → 별도 Phase로 이연
  - 📋 SRS 알고리즘 유닛 테스트 작성 권장

---

## Phase 목표

### 핵심 목표

- [x] 플래시카드 학습 시스템
- [x] Spaced Repetition 알고리즘 (SM-2 기반)
- [ ] ~~5가지 학습 모드 구현~~ → 플래시카드 모드 완료, 나머지 4종은 별도 Phase로 이연
- [x] 마스터 레벨 시스템 (New → Learning → Reviewing → Mastered)
- [x] 복습 스케줄링 자동화

### 사전 요구사항

- Better-Auth 인증 시스템 동작 확인
- UserProfile 모델 (Phase 1-2에서 생성) 존재
- PostgreSQL (Neon Cloud) 데이터베이스 연결 정상

### 추가 필요 의존성

```bash
npm install zod
```

---

## 구현 단계

### Step 1: 데이터베이스 스키마 확장 (1일차)

#### 1.1 Prisma Schema 추가

`prisma/schema.prisma`에 추가:

```prisma
// 어휘 콘텐츠 - ✅ 구현 완료 (2026-02-06)
model Vocabulary {
  id              String   @id @default(cuid())
  word            String   @unique
  meaning         String   // 한글 뜻
  pronunciation   String?  // 발음 기호
  exampleSentence String?  // 예문
  category        String   // daily, business, toeic, travel
  level           String   // A1-C2
  audioUrl        String?  // 발음 오디오 URL

  srsProgress     VocabularySRS[]

  createdAt       DateTime @default(now())

  @@index([level, category])
  @@map("vocabularies")
}

// 사용자 어휘 진행도 (SRS) - ✅ 구현 완료 (2026-02-06)
// 실제 모델명: VocabularySRS
model VocabularySRS {
  id              String   @id @default(cuid())
  userId          String
  vocabularyId    String

  // SRS 데이터
  masteryLevel    String   @default("new") // new, learning, reviewing, mastered
  repetitions     Int      @default(0)     // 연속 정답 횟수
  easeFactor      Float    @default(2.5)   // 난이도 계수 (1.3 이상, 초기값 2.5)
  interval        Int      @default(1)     // 다음 복습까지 일수

  lastReviewDate  DateTime?
  nextReviewDate  DateTime @default(now())

  // 통계
  totalReviews    Int      @default(0)
  correctCount    Int      @default(0)
  incorrectCount  Int      @default(0)

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  vocabulary      Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, vocabularyId])
  @@index([userId, nextReviewDate])
  @@index([userId, masteryLevel])
  @@map("vocabulary_srs")
}

// 플래시카드 세션
model FlashcardSession {
  id              String   @id @default(cuid())
  userId          String
  mode            String   // matching, choice, typing, listening, flashcard
  vocabularyCount Int      // 학습한 단어 수
  accuracy        Float    // 정확도 %
  duration        Int      // 세션 시간 (초)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
  @@map("flashcard_sessions")
}

// User 모델에 관계 추가 - ✅ 구현 완료 (2026-02-06)
model User {
  // ... 기존 필드들 (id, name, email, emailVerified, image, createdAt, updatedAt)
  // ... 기존 관계들 (accounts, sessions)

  vocabularySRS     VocabularySRS[]
  flashcardSessions FlashcardSession[]
}

// UserProfile 모델 확장 (Phase 1-2에서 생성된 모델에 필드 추가)
model UserProfile {
  // ... 기존 필드들

  totalWordLearned Int      @default(0)
  masteredWords    Int      @default(0)
  reviewNeeded     Int      @default(0)
}
```

> **참고**: UserProfile 모델은 Phase 1-2에서 이미 생성되어 있어야 합니다.
> 해당 모델에 `totalWordLearned`, `masteredWords`, `reviewNeeded` 필드만 추가합니다.
> User 모델은 Better-Auth에서 생성한 기존 모델에 관계만 추가합니다.

#### 1.2 마이그레이션 - ✅ 완료 (2026-02-06)

```bash
npx prisma migrate dev --name add_vocabulary_srs
npx prisma generate
```

**실행 결과**:
- ✅ Migration: `20260205184109_add_vocabulary_srs` 생성 완료
- ✅ 테이블 생성: `vocabularies`, `vocabulary_srs`, `flashcard_sessions`
- ✅ Prisma Client 재생성 완료

---

### Step 2: SRS 알고리즘 구현 (2-3일차) - ✅ 완료 (2026-02-06)

#### 2.1 SM-2 기반 SRS 알고리즘 - ✅ 구현 완료

`lib/srs/algorithm.ts`:

```typescript
export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

export type ReviewQuality = "easy" | "normal" | "hard" | "forgot";

export interface SRSCard {
  masteryLevel: MasteryLevel;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReviewDate: Date | null;
  nextReviewDate: Date;
}

export interface SRSResult {
  masteryLevel: MasteryLevel;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
}

/**
 * SM-2 알고리즘 기반 복습 스케줄 계산
 *
 * SM-2 핵심 원리:
 * - 정답 시: repetitions 증가, interval은 단계별 고정 또는 easeFactor 곱
 * - 오답 시: repetitions 리셋, interval 1일로 초기화
 * - easeFactor: 최소 1.3, 상한 없음 (보통 2.5 시작)
 */
export function calculateNextReview(card: SRSCard, quality: ReviewQuality, isCorrect: boolean): SRSResult {
  const now = new Date();

  // 오답인 경우: repetitions 리셋, interval 1일
  if (!isCorrect || quality === "forgot") {
    return {
      masteryLevel: card.masteryLevel === "new" ? "new" : "learning",
      repetitions: 0,
      easeFactor: Math.max(1.3, card.easeFactor - 0.2),
      interval: 1,
      nextReviewDate: addDays(now, 1),
    };
  }

  // 정답인 경우
  const newRepetitions = card.repetitions + 1;

  // easeFactor 조정 (quality에 따라)
  let newEaseFactor = card.easeFactor;
  switch (quality) {
    case "easy":
      newEaseFactor = card.easeFactor + 0.15;
      break;
    case "normal":
      // easeFactor 변동 없음
      break;
    case "hard":
      newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
      break;
  }

  // interval 계산 (SM-2 표준: 초기 단계는 고정, 이후 easeFactor 곱)
  let newInterval: number;
  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 3;
  } else if (newRepetitions === 3) {
    newInterval = 7;
  } else {
    // 4번째 반복부터 easeFactor 적용
    const baseInterval = card.interval * newEaseFactor;

    // quality에 따른 보정
    if (quality === "easy") {
      newInterval = Math.round(baseInterval * 1.3);
    } else if (quality === "hard") {
      newInterval = Math.round(baseInterval * 0.8);
    } else {
      newInterval = Math.round(baseInterval);
    }
  }

  // 최소 interval 보장
  newInterval = Math.max(1, newInterval);

  // 마스터 레벨 결정
  let newMasteryLevel: MasteryLevel;
  if (newRepetitions >= 8 && newInterval >= 180) {
    newMasteryLevel = "mastered";
  } else if (newRepetitions >= 3 && newInterval >= 30) {
    newMasteryLevel = "reviewing";
  } else if (newRepetitions >= 1) {
    newMasteryLevel = "learning";
  } else {
    newMasteryLevel = card.masteryLevel;
  }

  return {
    masteryLevel: newMasteryLevel,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate: addDays(now, newInterval),
  };
}

/**
 * 복습 필요 여부 확인
 */
export function isReviewDue(nextReviewDate: Date): boolean {
  return new Date() >= nextReviewDate;
}

/**
 * 날짜에 일수 추가
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 마스터 레벨별 다음 복습 간격 (기본값)
 */
export const DEFAULT_INTERVALS: Record<MasteryLevel, number> = {
  new: 1, // 1일
  learning: 3, // 3일
  reviewing: 30, // 30일
  mastered: 180, // 180일
};
```

#### 2.2 SRS 서비스

`lib/srs/service.ts`:

```typescript
import { prisma } from "@/lib/db";
import { calculateNextReview, type ReviewQuality, isReviewDue } from "./algorithm";

/**
 * 복습 필요한 단어 조회
 */
export async function getDueVocabularies(userId: string, limit: number = 20) {
  const now = new Date();

  const dueCards = await prisma.userVocabulary.findMany({
    where: {
      userId,
      nextReviewDate: {
        lte: now,
      },
    },
    include: {
      vocabulary: true,
    },
    orderBy: {
      nextReviewDate: "asc",
    },
    take: limit,
  });

  return dueCards;
}

/**
 * 새로운 단어 조회 (아직 학습하지 않은 단어)
 */
export async function getNewVocabularies(userId: string, level: string, limit: number = 10) {
  const learnedVocabularyIds = await prisma.userVocabulary.findMany({
    where: { userId },
    select: { vocabularyId: true },
  });

  const learnedIds = learnedVocabularyIds.map((v) => v.vocabularyId);

  const newVocabularies = await prisma.vocabulary.findMany({
    where: {
      level,
      ...(learnedIds.length > 0 && {
        id: { notIn: learnedIds },
      }),
    },
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
  });

  return newVocabularies;
}

/**
 * 단어 복습 결과 저장
 */
export async function recordReview(userId: string, vocabularyId: string, quality: ReviewQuality, isCorrect: boolean) {
  // 현재 진행도 조회 또는 생성
  let userVocab = await prisma.userVocabulary.findUnique({
    where: {
      userId_vocabularyId: {
        userId,
        vocabularyId,
      },
    },
  });

  if (!userVocab) {
    userVocab = await prisma.userVocabulary.create({
      data: {
        userId,
        vocabularyId,
        masteryLevel: "new",
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: new Date(),
      },
    });
  }

  // SRS 알고리즘으로 다음 복습 계산
  const nextReview = calculateNextReview(
    {
      masteryLevel: userVocab.masteryLevel as ReviewQuality extends string ? any : never,
      repetitions: userVocab.repetitions,
      easeFactor: userVocab.easeFactor,
      interval: userVocab.interval,
      lastReviewDate: userVocab.lastReviewDate,
      nextReviewDate: userVocab.nextReviewDate,
    },
    quality,
    isCorrect
  );

  // 업데이트
  const updated = await prisma.userVocabulary.update({
    where: {
      userId_vocabularyId: {
        userId,
        vocabularyId,
      },
    },
    data: {
      masteryLevel: nextReview.masteryLevel,
      repetitions: nextReview.repetitions,
      easeFactor: nextReview.easeFactor,
      interval: nextReview.interval,
      lastReviewDate: new Date(),
      nextReviewDate: nextReview.nextReviewDate,
      totalReviews: { increment: 1 },
      ...(isCorrect ? { correctCount: { increment: 1 } } : { incorrectCount: { increment: 1 } }),
    },
    include: {
      vocabulary: true,
    },
  });

  // 프로필 통계 업데이트
  await updateProfileStats(userId);

  return updated;
}

/**
 * 프로필 통계 업데이트
 */
async function updateProfileStats(userId: string) {
  const stats = await prisma.userVocabulary.groupBy({
    by: ["masteryLevel"],
    where: { userId },
    _count: true,
  });

  const totalWordLearned = stats.reduce((sum, s) => sum + s._count, 0);
  const masteredWords = stats.find((s) => s.masteryLevel === "mastered")?._count || 0;

  const reviewNeeded = await prisma.userVocabulary.count({
    where: {
      userId,
      nextReviewDate: {
        lte: new Date(),
      },
    },
  });

  await prisma.userProfile.update({
    where: { userId },
    data: {
      totalWordLearned,
      masteredWords,
      reviewNeeded,
    },
  });
}
```

---

### Step 3: 플래시카드 API 구현 (3-5일차) - ✅ 완료 (2026-02-06)

#### 3.1 요청 검증 스키마 - ✅ 구현 완료

`lib/srs/validation.ts`:

```typescript
import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  vocabularyId: z.string().min(1),
  quality: z.enum(["easy", "normal", "hard", "forgot"]),
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0),
});

export const reviewRequestSchema = z.object({
  reviews: z.array(reviewSubmissionSchema).min(1).max(100),
  mode: z.enum(["flashcard", "matching", "choice", "typing", "listening"]),
  duration: z.number().int().min(0),
});

export const sessionQuerySchema = z.object({
  mode: z.enum(["review", "new"]).default("review"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
```

#### 3.2 서버 세션 헬퍼 - ✅ 구현 완료

> Better-Auth는 NextAuth와 달리 `auth()` 함수를 직접 제공하지 않으므로,
> 서버 사이드에서 세션을 확인하려면 `auth.api.getSession()`을 사용합니다.

`lib/auth-session.ts`:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * 서버 사이드에서 Better-Auth 세션 조회
 * Route Handler 및 Server Component에서 사용
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
```

#### 3.3 복습 세션 시작 API - ✅ 구현 완료

`app/api/flashcard/session/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getDueVocabularies, getNewVocabularies } from "@/lib/srs/service";
import { prisma } from "@/lib/db";
import { sessionQuerySchema } from "@/lib/srs/validation";

export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(req.url);
    const parsed = sessionQuerySchema.safeParse({
      mode: searchParams.get("mode"),
      limit: searchParams.get("limit"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청 파라미터입니다", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mode, limit } = parsed.data;

    // 사용자 프로필 조회
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다" }, { status: 404 });
    }

    let vocabularies;

    if (mode === "review") {
      const dueCards = await getDueVocabularies(session.user.id, limit);
      vocabularies = dueCards.map((card) => ({
        id: card.vocabulary.id,
        word: card.vocabulary.word,
        meaning: card.vocabulary.meaning,
        pronunciation: card.vocabulary.pronunciation,
        exampleSentence: card.vocabulary.exampleSentence,
        audioUrl: card.vocabulary.audioUrl,
        masteryLevel: card.masteryLevel,
        nextReviewDate: card.nextReviewDate,
      }));
    } else {
      const newVocabs = await getNewVocabularies(session.user.id, profile.level, limit);
      vocabularies = newVocabs.map((vocab) => ({
        id: vocab.id,
        word: vocab.word,
        meaning: vocab.meaning,
        pronunciation: vocab.pronunciation,
        exampleSentence: vocab.exampleSentence,
        audioUrl: vocab.audioUrl,
        masteryLevel: "new" as const,
        nextReviewDate: new Date(),
      }));
    }

    return NextResponse.json({
      vocabularies,
      mode,
      count: vocabularies.length,
    });
  } catch (error) {
    console.error("Flashcard session error:", error);
    return NextResponse.json({ error: "세션 생성 중 오류가 발생했습니다" }, { status: 500 });
  }
}
```

#### 3.4 복습 제출 API - ✅ 구현 완료

`app/api/flashcard/review/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { recordReview } from "@/lib/srs/service";
import { prisma } from "@/lib/db";
import { reviewRequestSchema } from "@/lib/srs/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 요청 본문 검증
    const body = await req.json();
    const parsed = reviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "잘못된 요청 데이터입니다", details: parsed.error.flatten() }, { status: 400 });
    }

    const { reviews, mode, duration } = parsed.data;

    // 각 단어 복습 결과 저장
    const results = await Promise.all(
      reviews.map((review) => recordReview(session.user.id, review.vocabularyId, review.quality, review.isCorrect))
    );

    // 세션 기록 저장
    const correctCount = reviews.filter((r) => r.isCorrect).length;
    const accuracy = (correctCount / reviews.length) * 100;

    await prisma.flashcardSession.create({
      data: {
        userId: session.user.id,
        mode,
        vocabularyCount: reviews.length,
        accuracy,
        duration,
      },
    });

    // XP 계산 (정답당 5 XP)
    const xpEarned = correctCount * 5;

    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        totalXP: { increment: xpEarned },
        lastStudyDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: reviews.length,
        correct: correctCount,
        accuracy: Math.round(accuracy),
        xpEarned,
      },
      results: results.map((r) => ({
        vocabularyId: r.vocabularyId,
        masteryLevel: r.masteryLevel,
        nextReviewDate: r.nextReviewDate,
      })),
    });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "복습 제출 중 오류가 발생했습니다" }, { status: 500 });
  }
}
```

---

### Step 4: 플래시카드 UI 구현 (5-10일차) - ✅ 완료

> **실제 구현 위치**: `features/flashcard/` (FSD 구조)
> - `features/flashcard/ui/` - UI 컴포넌트 (flow/, result/, status/ 하위 구조)
> - `features/flashcard/hooks/` - React 훅 (use-flashcard-session, use-flashcard-review 등)
> - `features/flashcard/api/` - API 클라이언트 (flashcard-api.ts)
> - `features/flashcard/config/` - 설정 상수 (difficulty, mastery, routes 등)
> - `features/flashcard/types/` - TypeScript 타입 정의
>
> **라우트 구조**:
> - `app/(immersive)/flashcard/page.tsx` - 플래시카드 메인 (몰입형 레이아웃)
> - `app/(shell)/flashcard/result/page.tsx` - 학습 결과
> - `app/(shell)/flashcard/modes/page.tsx` - 학습 모드 선택

#### 4.1 플래시카드 메인 페이지 - ✅ 완료

**설계 문서 참고**: 아래 코드는 참고용이며, 실제 구현은 FSD 구조를 따릅니다.

`app/flashcard/page.tsx` (참고용):

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  audioUrl?: string;
  masteryLevel: string;
}

interface ReviewEntry {
  vocabularyId: string;
  quality: "easy" | "normal" | "hard" | "forgot";
  isCorrect: boolean;
  timeSpent: number;
}

export default function FlashcardPage() {
  const router = useRouter();
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [mode, setMode] = useState<"review" | "new">("review");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 세션 시작 시각과 카드별 시작 시각 분리
  const sessionStartTime = useRef(Date.now());
  const cardStartTime = useRef(Date.now());

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcard/session?mode=${mode}&limit=20`);

      if (!response.ok) {
        throw new Error("카드를 불러오는데 실패했습니다");
      }

      const data = await response.json();
      setCards(data.vocabularies);
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviews([]);
      sessionStartTime.current = Date.now();
      cardStartTime.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality: "easy" | "normal" | "hard" | "forgot") => {
    const currentCard = cards[currentIndex];
    const isCorrect = quality !== "forgot";

    // 현재 카드에 소요된 시간 (초)
    const timeSpent = Math.floor((Date.now() - cardStartTime.current) / 1000);

    const newReview: ReviewEntry = {
      vocabularyId: currentCard.id,
      quality,
      isCorrect,
      timeSpent,
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);

    // 다음 카드로
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      cardStartTime.current = Date.now();
    } else {
      // 세션 종료
      await submitSession(updatedReviews);
    }
  };

  const submitSession = async (allReviews: ReviewEntry[]) => {
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    try {
      const response = await fetch("/api/flashcard/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: allReviews,
          mode,
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error("결과 제출에 실패했습니다");
      }

      const result = await response.json();
      const params = new URLSearchParams({
        xp: String(result.summary.xpEarned),
        accuracy: String(result.summary.accuracy),
        total: String(result.summary.total),
        correct: String(result.summary.correct),
      });
      router.push(`/flashcard/result?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 제출 중 오류가 발생했습니다");
    }
  };

  const playAudio = () => {
    const audioUrl = cards[currentIndex]?.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        // 오디오 재생 실패 시 무시
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">카드를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadCards} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">복습할 단어가 없습니다</p>
          <button onClick={() => setMode("new")} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            새로운 단어 학습하기
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">플래시카드 학습</h1>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 플립 카드 */}
        <div className="mb-8" style={{ perspective: "1000px" }}>
          <div
            className="relative min-h-[400px] cursor-pointer"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
            onClick={handleFlip}
          >
            {/* 앞면 (영어) */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-5xl font-bold mb-6">{currentCard.word}</div>
              {currentCard.pronunciation && (
                <div className="text-xl text-gray-500 mb-4">{currentCard.pronunciation}</div>
              )}
              {currentCard.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="text-blue-600 hover:text-blue-700"
                  aria-label="발음 듣기"
                >
                  🔊 발음 듣기
                </button>
              )}
              <div className="mt-8 text-sm text-gray-400">카드를 클릭하여 뒤집기</div>
            </div>

            {/* 뒷면 (한글) */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="text-4xl font-bold mb-6 text-blue-600">{currentCard.meaning}</div>
              {currentCard.exampleSentence && (
                <div className="text-lg text-gray-700 max-w-md text-center">{currentCard.exampleSentence}</div>
              )}
            </div>
          </div>
        </div>

        {/* 난이도 평가 버튼 */}
        {isFlipped && (
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleReview("forgot")}
              className="py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              모르겠어요
            </button>
            <button
              onClick={() => handleReview("hard")}
              className="py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              어려워요
            </button>
            <button
              onClick={() => handleReview("normal")}
              className="py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              괜찮아요
            </button>
            <button
              onClick={() => handleReview("easy")}
              className="py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              쉬워요
            </button>
          </div>
        )}

        {/* 마스터 레벨 표시 */}
        <div className="mt-6 text-center">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              currentCard.masteryLevel === "mastered"
                ? "bg-green-100 text-green-800"
                : currentCard.masteryLevel === "reviewing"
                ? "bg-blue-100 text-blue-800"
                : currentCard.masteryLevel === "learning"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {currentCard.masteryLevel === "mastered"
              ? "완벽 습득"
              : currentCard.masteryLevel === "reviewing"
              ? "복습 중"
              : currentCard.masteryLevel === "learning"
              ? "학습 중"
              : "새로운 단어"}
          </span>
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 학습 결과 페이지

`app/flashcard/result/page.tsx`:

```typescript
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const xp = Number(searchParams.get("xp") || 0);
  const accuracy = Number(searchParams.get("accuracy") || 0);
  const total = Number(searchParams.get("total") || 0);
  const correct = Number(searchParams.get("correct") || 0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}</div>
          <h1 className="text-2xl font-bold mb-2">학습 완료!</h1>
          <p className="text-gray-600 mb-8">수고하셨습니다</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-sm text-gray-600">정확도</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">+{xp}</div>
              <div className="text-sm text-gray-600">XP 획득</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600">{correct}</div>
              <div className="text-sm text-gray-600">정답</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-600">{total}</div>
              <div className="text-sm text-gray-600">총 문제</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/flashcard")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              계속 학습하기
            </button>
            <button
              onClick={() => router.push("/flashcard/modes")}
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              학습 모드 변경
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
```

#### 4.3 학습 모드 선택 페이지

`app/flashcard/modes/page.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";

const STUDY_MODES = [
  {
    id: "flashcard",
    name: "플래시카드",
    description: "앞뒤로 넘기며 학습",
    icon: "🃏",
    route: "/flashcard",
  },
  {
    id: "matching",
    name: "매칭 모드",
    description: "한글 뜻과 영어 단어 짝맞추기",
    icon: "🔗",
    route: "/flashcard/matching",
  },
  {
    id: "choice",
    name: "선택 모드",
    description: "4개 선택지에서 정답 선택",
    icon: "✅",
    route: "/flashcard/choice",
  },
  {
    id: "typing",
    name: "타이핑 모드",
    description: "영어 단어 직접 입력",
    icon: "⌨️",
    route: "/flashcard/typing",
  },
  {
    id: "listening",
    name: "듣기 모드",
    description: "영어 발음 듣고 선택",
    icon: "🎧",
    route: "/flashcard/listening",
  },
];

export default function StudyModesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">학습 모드 선택</h1>
          <p className="text-gray-600">원하는 방식으로 단어를 학습하세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {STUDY_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => router.push(mode.route)}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-all text-left"
            >
              <div className="text-5xl mb-4">{mode.icon}</div>
              <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
              <p className="text-gray-600">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

> **이연 결정 (2026-03-18)**: 매칭, 선택, 타이핑, 듣기 모드는 별도 Phase로 이연합니다.
>
> **이연 사유**:
> - 플래시카드 모드의 실사용 검증이 선행되어야 함 (SRS 알고리즘 동작, UI 흐름 피드백)
> - 4개 모드 모두 동일한 SRS API(`/api/flashcard/review`)를 공유하므로 백엔드 추가 작업 없음
> - UI 껍데기만 다른 구조여서 나중에 추가해도 기술 부채 없음
> - Phase 1-4(발음 진단) 등 후속 핵심 기능의 진행이 우선
>
> **우선순위 참고**: 선택 모드(4지선다)는 능동적 회상 테스트로서 SRS 학습 효과를 높이므로,
> 추가 모드 중 가장 먼저 구현하는 것을 권장합니다.
>
> 모드 선택 페이지(`app/(shell)/flashcard/modes/page.tsx`)에서 미구현 모드는 "준비 중"으로 표시됩니다.

---

## 완료 체크리스트

### 데이터베이스

- [x] Schema 확장 완료 (UserVocabulary, Vocabulary, FlashcardSession)
- [x] 마이그레이션 성공 (20260205184109_add_vocabulary_srs)
- [x] 초기 어휘 데이터 입력 (100개 - A1/A2 레벨 daily 카테고리)
- [x] 전체 어휘 데이터 확장 (1340+ 개, 목표 1000개 초과 달성)

### SRS 시스템

- [x] SM-2 알고리즘 구현 (`features/flashcard/lib/srs-algorithm.ts`)
- [x] 복습 스케줄링 로직 (`calculateNextReview`, `isReviewDue`)
- [x] 마스터 레벨 시스템 (new → learning → reviewing → mastered)
- [x] SRS 서비스 구현 (`features/flashcard/lib/srs-service.ts`)
  - [x] getDueVocabularies
  - [x] getNewVocabularies
  - [x] recordReview
  - [x] updateProfileStats
  - [x] getVocabularyStats

### API

- [x] 요청 검증 스키마 (Zod - `features/flashcard/lib/srs-validation.ts`)
- [x] 서버 세션 헬퍼 (Better-Auth - `shared/lib/get-session.ts`)
- [x] 세션 시작 API (`app/api/flashcard/session/route.ts`)
- [x] 복습 제출 API (`app/api/flashcard/review/route.ts`)
- [x] 통계 업데이트 로직 (UserProfile 자동 업데이트)
- [x] XP 시스템 연동 (정답당 5XP)
- [x] 스트릭 시스템 연동 (`entities/user` getStreakUpdateData)

### UI (FSD 구조: `features/flashcard/`)

- [x] 플래시카드 UI (플립 애니메이션 포함)
  - [x] 기본 구조 설계 (`features/flashcard/ui/`)
  - [x] 컴포넌트 구현 (flow/, result/, status/ 하위 구조)
  - [x] 플립 애니메이션 추가
- [x] 학습 모드 선택 (`app/(shell)/flashcard/modes/page.tsx`)
- [x] 학습 결과 페이지 (`app/(shell)/flashcard/result/page.tsx`)
- [x] 에러 및 로딩 상태 처리 (flashcard-loading, flashcard-error, flashcard-empty)
- [ ] ~~나머지 4가지 학습 모드 (매칭, 선택, 타이핑, 듣기)~~ → 별도 Phase로 이연

---

## 테스트 시나리오

### SRS 알고리즘 (✅ 구현 완료, 유닛 테스트 작성 권장)

> **테스트 권장 사유**: SRS 알고리즘은 순수 함수이므로 테스트 비용이 낮고,
> 버그 발생 시 사용자 학습 데이터가 잘못 축적되어 복구가 어렵습니다.
> easeFactor 경계값, interval 계산 오류 등은 눈에 잘 보이지 않아 발견이 늦습니다.

1. [x] 정답 시 interval 증가 (repetitions 1→1일, 2→3일, 3→7일, 4+→easeFactor 적용)
2. [x] 오답 시 repetitions 리셋, interval 1일로 초기화
3. [x] 마스터 레벨 승급 (new → learning → reviewing → mastered)
4. [x] easeFactor 조정: easy +0.15, hard -0.15, forgot -0.2 (최소 1.3)
5. [x] easeFactor 상한 제한 없이 easy 반복 시 점진적 증가 확인

### 학습 플로우 (✅ API 구현 완료)

1. [x] 복습 필요 단어 조회 (nextReviewDate <= now)
2. [x] 새로운 단어 추가 (학습 이력 없는 단어만)
3. [x] 복습 결과 저장 및 SRS 데이터 업데이트
4. [x] UserProfile 통계 업데이트

### API 검증 (✅ 구현 완료)

> API E2E 테스트는 인증/DB 연결 등 셋업 비용이 높고, API 로직 자체가 단순 CRUD에 가까워 보류합니다.

1. [x] 미인증 사용자 401 응답
2. [x] 잘못된 요청 파라미터 400 응답 (Zod 검증)
3. [x] 정상 세션 생성 및 카드 반환
4. [x] 복습 결과 제출 및 XP 계산

### UI (✅ 구현 완료)

> UI 통합 테스트는 사용자 피드백에 따라 UI 변경 가능성이 높아 보류합니다.

1. [x] 카드 플립 애니메이션 동작
2. [x] 카드별 소요 시간 정확히 측정
3. [x] 로딩/에러/빈 상태 UI 표시
4. [x] 세션 완료 후 결과 페이지 이동

---

## 초기 데이터 준비 - ✅ 완료 (1340+개, 목표 초과 달성)

### 현재 상태 (2026-03-18)

- ✅ **데이터 파일**: `prisma/data/vocabularies.json` (기본 데이터) + 4개 추가 파일
- ✅ **Seed 스크립트**: `prisma/seed-vocabulary.ts` 구현 완료 (배치 insert, skipDuplicates)
- ✅ **데이터 구성**: A1~C2 전 레벨, daily/business/toeic/travel 전 카테고리
- ✅ **목표 달성**: 1340+ 어휘 (원래 목표 1000개 초과)

### Seed 스크립트

`prisma/seed-vocabulary.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface VocabSeed {
  word: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
  category: "daily" | "business" | "toeic" | "travel";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

// 카테고리/레벨별 어휘 데이터
const vocabularies: VocabSeed[] = [
  // === A1 Daily ===
  {
    word: "apple",
    meaning: "사과",
    pronunciation: "/ˈæpəl/",
    exampleSentence: "I ate an apple for breakfast.",
    category: "daily",
    level: "A1",
  },
  {
    word: "water",
    meaning: "물",
    pronunciation: "/ˈwɔːtər/",
    exampleSentence: "Can I have a glass of water?",
    category: "daily",
    level: "A1",
  },
  // ... 레벨/카테고리별 데이터 추가
  // A1: 200개, A2: 200개, B1: 200개, B2: 200개, C1: 100개, C2: 100개
  // 카테고리 분배: daily 40%, toeic 25%, business 20%, travel 15%
];

async function main() {
  console.log(`Starting vocabulary seed... (${vocabularies.length} words)`);

  let created = 0;
  let skipped = 0;

  for (const vocab of vocabularies) {
    try {
      await prisma.vocabulary.upsert({
        where: { word: vocab.word },
        update: {}, // 이미 존재하면 건너뛰기
        create: vocab,
      });
      created++;
    } catch (error) {
      console.warn(`Skipped "${vocab.word}":`, error);
      skipped++;
    }
  }

  console.log(`Vocabulary seed complete! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

> **참고**: 실제 1000개 어휘 데이터는 별도 JSON 파일(`prisma/data/vocabularies.json`)로 관리하고,
> seed 스크립트에서 import하여 사용하는 것을 권장합니다.

### package.json seed 스크립트 등록

```json
{
  "prisma": {
    "seed": "tsx prisma/seed-vocabulary.ts"
  }
}
```

---

## 진행 상황

### ✅ 핵심 구현 완료 (2026-03-18)

1. **데이터베이스 스키마** (Migration: 20260205184109_add_vocabulary_srs)
   - UserVocabulary 모델 (SRS 진행도 추적)
   - Vocabulary 모델 (어휘 콘텐츠)
   - FlashcardSession 모델 (학습 세션 기록, quality 카운트 포함)

2. **SRS 알고리즘** (`features/flashcard/lib/`)
   - SM-2 기반 복습 간격 계산 (`srs-algorithm.ts`)
   - 마스터 레벨 시스템 4단계 (`srs-service.ts`)
   - easeFactor 조정 로직
   - Zod 검증 스키마 (`srs-validation.ts`)

3. **API 엔드포인트** (`app/api/flashcard/`)
   - GET `/api/flashcard/session` - 복습 세션 시작
   - POST `/api/flashcard/review` - 복습 결과 제출
   - Better-Auth 세션 인증 (`shared/lib/get-session.ts`)
   - XP 시스템 연동 (정답당 5XP)
   - 스트릭 시스템 연동

4. **어휘 데이터** (1340+ 개)
   - 기본: `prisma/data/vocabularies.json`
   - 추가: extra-a1-a2, extra-b1-b2, extra-c1-c2, extra-supplement JSON 파일
   - A1~C2 전 레벨, daily/business/toeic/travel 전 카테고리

5. **Flashcard UI** (`features/flashcard/`)
   - FSD 구조: ui/ (flow, result, status), hooks/, api/, config/, types/
   - 플래시카드 메인 페이지 (플립 애니메이션)
   - 학습 결과 페이지, 학습 모드 선택 페이지
   - 로딩/에러/빈 상태 처리

### ⏸️ 이연 항목 (별도 Phase)

> **이연 결정 사유**: 플래시카드 핵심 모드의 실사용 검증이 우선이며,
> 추가 모드는 동일 SRS API를 공유하므로 나중에 추가해도 기술 부채가 없음.
> Phase 1-4(발음 진단) 등 후속 핵심 기능 진행이 우선.

1. **추가 학습 모드**
   - [ ] 선택 모드 (4지선다) — 능동적 회상 테스트로 학습 효과 높음, **차순위 1순위**
   - [ ] 매칭 모드 (한-영 짝맞추기)
   - [ ] 타이핑 모드 (직접 입력)
   - [ ] 듣기 모드 (발음 듣고 선택) — audioUrl 데이터 확보 필요

### 📋 권장 후속 작업

1. **SRS 알고리즘 유닛 테스트** (권장)
   - 순수 함수이므로 테스트 비용 낮음
   - 버그 시 사용자 학습 데이터 오염, 발견 어려움
   - easeFactor 경계값, interval 계산, 마스터 레벨 승급 조건 검증

2. ~~API E2E 테스트~~ (보류) — 테스트 인프라 셋업 비용 대비 효과 낮음
3. ~~UI 통합 테스트~~ (보류) — UI 변경 가능성 높아 유지보수 부담

## 다음 단계

### Phase 1-3 완료 → Phase 1-4 진행

- **Phase 1-4: 발음 진단 시스템**
  - Web Speech API 통합
  - 음소별 분석 구현
  - 발음 평가 알고리즘

- **추가 학습 모드 (별도 Phase)**
  - 선택 모드(4지선다) 우선 구현 권장
  - 이후 매칭, 타이핑, 듣기 모드 순차 추가
  - 각 모드별 UI/UX 최적화
