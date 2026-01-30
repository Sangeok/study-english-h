# Better-Auth를 이용한 Kakao Social Login 구현 가이드

## 📋 문서 정보
- **작성일**: 2026-01-30
- **프로젝트명**: study-eng-h
- **버전**: v1.0
- **목표**: Better-Auth + Kakao OAuth 통합
- **기술 스택**: Next.js 16, Better-Auth, Kakao API

---

## 🎯 개요

이 문서는 Better-Auth를 사용하여 Kakao 소셜 로그인을 Phase 1에 구현하는 방법을 단계별로 설명합니다.

### 주요 기능
- ✅ Kakao OAuth 인증
- ✅ 자동 사용자 생성 및 프로필 관리
- ✅ JWT 토큰 관리
- ✅ 세션 관리
- ✅ 타입 안전성 (TypeScript)

---

## 📦 설치 및 초기 설정

### 1. 필요 패키지 설치

```bash
npm install better-auth
npm install @better-auth/core
npm install next-fetch
npm install dotenv
npm install @prisma/client
npm install prisma
```

### 2. 개발 종속성 설치

```bash
npm install -D @types/node typescript ts-node
```

### 3. 패키지.json 스크립트 추가

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

---

## 🔑 Kakao OAuth 앱 등록

### 1. Kakao Developers 가입

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 개인/회사 계정으로 로그인 또는 회원가입

### 2. 애플리케이션 생성

```
1. 내 애플리케이션 → 애플리케이션 추가하기
2. 앱 이름: "study-eng-h" (또는 프로젝트명)
3. 사업자명: 개인 개발자 또는 회사명 입력
4. 만들기
```

### 3. 앱 키 확인

```
앱 설정 → 일반
────────────────────────
REST API 키: [복사해두기]
Client Secret: [복사해두기]
```

### 4. Redirect URI 설정

```
앱 설정 → 제품 설정 → Kakao Login
────────────────────────────────────
활성화 설정: ON

Redirect URI 등록:
- 로컬 개발: http://localhost:3000/api/auth/callback/kakao
- 프로덕션: https://yourdomain.com/api/auth/callback/kakao

+ 추가 클릭하여 모두 등록
```

### 5. Kakao Login 권한 설정

```
동의항목
────────────────────────
필수 동의항목:
- 닉네임 (프로필 정보): 필수
- 프로필 사진 URL: 선택
- 카카오계정(이메일): 필수
- 성별: 선택
- 생일: 선택
```

---

## 🔐 환경 변수 설정

### .env.local 파일 생성

```bash
# Kakao OAuth
KAKAO_ID=YOUR_KAKAO_REST_API_KEY
KAKAO_SECRET=YOUR_KAKAO_CLIENT_SECRET
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/callback/kakao

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/study_eng_h

# Node Environment
NODE_ENV=development
```

### .env.example 파일 (공개용)

```bash
# Kakao OAuth
KAKAO_ID=
KAKAO_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/callback/kakao

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/study_eng_h

# Node Environment
NODE_ENV=development
```

---

## 🗄️ 데이터베이스 스키마 (Prisma)

### prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth 스키마
model User {
  id            String    @id
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 소셜 로그인 연결
  accounts      Account[]
  sessions      Session[]

  // 학습 관련 필드
  userProfile   UserProfile?
  userProgress  UserProgress[]
  userVocabulary UserVocabulary[]
  userLeague    UserLeague?
  userStreak    UserStreak?
}

model Account {
  id            String    @id
  userId        String
  type          String    // "oauth" 등
  provider      String    // "kakao"
  providerAccountId String
  accessToken   String?   @db.Text
  refreshToken  String?   @db.Text
  expiresAt     Int?
  tokenType     String?
  scope         String?
  idToken       String?   @db.Text
  sessionState  String?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id            String    @id
  sessionToken  String    @unique
  expires       DateTime

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// 학습 관련 스키마
model UserProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  nickname        String?
  profileImage    String?
  level           String    @default("A1")
  totalXP         Int       @default(0)
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model UserProgress {
  id              String    @id @default(cuid())
  userId          String
  lessonId        String
  status          String    @default("in_progress") // in_progress, completed
  accuracy        Float?
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}

model UserVocabulary {
  id              String    @id @default(cuid())
  userId          String
  vocabularyId    String
  masteryLevel    String    @default("new") // new, learning, reviewing, mastered
  lastReviewDate  DateTime?
  nextReviewDate  DateTime?
  attemptCount    Int       @default(0)
  correctCount    Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, vocabularyId])
  @@index([userId])
}

model UserLeague {
  id              String    @id @default(cuid())
  userId          String    @unique
  leaguePoints    Int       @default(0)
  tier            String    @default("Bronze")
  joinedAt        DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model UserStreak {
  id              String    @id @default(cuid())
  userId          String    @unique
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  lastStudyDate   DateTime?
  freezesUsed     Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Vocabulary {
  id              String    @id @default(cuid())
  word            String    @unique
  meaning         String
  example         String?
  category        String
  level           String    // A1, A2, B1, B2, C1, C2
  pronunciation  String?
  audioUrl        String?
  createdAt       DateTime  @default(now())

  @@index([level])
  @@index([category])
}

model QuizQuestion {
  id              String    @id @default(cuid())
  difficulty      String
  category        String
  koreanHint      String
  englishWord     String
  sentence        String
  options         String[]  // JSON array
  correctAnswer   String
  exampleSentence String?
  pronunciation  String?
  audioUrl        String?
  createdAt       DateTime  @default(now())

  @@index([difficulty])
  @@index([category])
}
```

### 스키마 적용

```bash
# 데이터베이스에 스키마 적용
npx prisma db push

# Prisma Studio로 데이터 확인 (선택사항)
npx prisma studio
```

---

## 🔧 Better-Auth 설정

### lib/auth.ts (핵심 인증 설정)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { kakao } from "better-auth/providers/kakao";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();

export const auth = betterAuth({
  // 기본 설정
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,

  // 데이터베이스 어댑터
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // 플러그인
  plugins: [nextCookies()],

  // OAuth 제공자
  socialProviders: {
    kakao: {
      clientId: process.env.KAKAO_ID!,
      clientSecret: process.env.KAKAO_SECRET!,
      redirectURI: process.env.KAKAO_REDIRECT_URI!,
    },
  },

  // 세션 설정
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAgeUntilAndTime: 60 * 60 * 24, // 1일
    cookieCache: {
      disabled: false,
      maxAge: 5 * 60, // 5분
    },
  },

  // 계정 설정
  account: {
    accountLinkingEnabled: true, // 여러 소셜 계정 연동 허용
  },

  // 이메일 설정 (선택사항)
  emailVerification: {
    sendVerificationEmail: false, // MVP에서는 비활성화
  },

  // 콜백 훅
  callbacks: {
    async signUpResponse(ctx) {
      // 회원가입 완료 후 실행
      return Response.json(ctx.user);
    },
    async signInResponse(ctx) {
      // 로그인 완료 후 실행
      return Response.json(ctx.user);
    },
    // OAuth 후 사용자 생성 시
    async onOAuthUserCreated(ctx) {
      // 추가 프로필 데이터 초기화
      const user = ctx.user;

      // UserProfile 생성
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          nickname: user.name || "New Learner",
          profileImage: user.image,
          level: "A1",
          totalXP: 0,
        },
      });

      // UserStreak 생성
      await prisma.userStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });

      // UserLeague 생성
      await prisma.userLeague.create({
        data: {
          userId: user.id,
          leaguePoints: 0,
          tier: "Bronze",
        },
      });

      return;
    },
  },
});

export type Session = typeof auth.$Inferred.Session;
export type User = typeof auth.$Inferred.User;
```

### 환경 변수 검증 (lib/env.ts)

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Kakao OAuth
  KAKAO_ID: z.string().min(1, "KAKAO_ID is required"),
  KAKAO_SECRET: z.string().min(1, "KAKAO_SECRET is required"),
  KAKAO_REDIRECT_URI: z.string().url("KAKAO_REDIRECT_URI must be a valid URL"),

  // Better Auth
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
```

---

## 🔌 API 라우트 설정

### app/api/auth/[...nextauth]/route.ts (Better-Auth 엔드포인트)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### app/api/auth/kakao/callback/route.ts (Kakao 콜백)

```typescript
// Better-Auth가 자동으로 처리하므로,
// 실제로는 [...nextauth]/route.ts에서 모든 것을 처리합니다.
// 이 파일은 별도 처리가 필요한 경우에만 추가합니다.

// 현재는 추가 파일 불필요 - Better-Auth가 /api/auth/callback/kakao를 자동 생성
```

---

## 🎨 프론트엔드 구현

### hooks/useAuth.ts (인증 상태 관리)

```typescript
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Session, User } from "@/lib/auth";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await authClient.getSession();
        if (isMounted) {
          if (response?.user) {
            setUser(response.user);
            setSession(response.session);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
```

### lib/auth-client.ts (클라이언트 인증)

```typescript
import { createAuthClient } from "better-auth/react";
import { PrismaClient } from "@prisma/client";

// Better-Auth 클라이언트
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
});

// 소셜 로그인 함수
export async function signInWithKakao() {
  return await authClient.signIn.social(
    {
      provider: "kakao",
      callbackURL: "/dashboard", // 로그인 후 리디렉트
    },
    {
      onSuccess: (ctx) => {
        console.log("Kakao login successful:", ctx);
      },
      onError: (ctx) => {
        console.error("Kakao login failed:", ctx.error);
      },
    }
  );
}

// 로그아웃
export async function signOut() {
  return await authClient.signOut();
}

// 세션 확인
export async function getSession() {
  return await authClient.getSession();
}
```

### components/auth/KakaoLoginButton.tsx (Kakao 로그인 버튼)

```typescript
"use client";

import React, { useState } from "react";
import { signInWithKakao } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signInWithKakao();

      if (result?.error) {
        setError(result.error.message || "Login failed");
        return;
      }

      // 성공 시 대시보드로 이동
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleKakaoLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-black font-semibold rounded-lg transition-colors"
    >
      {/* Kakao 로고 */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 5.58 2 10c0 2.54 1.19 4.85 3.1 6.36L4 22l4.57-2.29c1.23.31 2.52.48 3.86.48 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
      </svg>
      {isLoading ? "Logging in..." : "Sign in with Kakao"}
    </button>
  );
}

export default KakaoLoginButton;
```

### components/auth/LoginPage.tsx (로그인 페이지)

```typescript
"use client";

import React from "react";
import { KakaoLoginButton } from "./KakaoLoginButton";

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Study Eng-H
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered English Learning Platform
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* 타이틀 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Kakao 로그인 */}
          <KakaoLoginButton />

          {/* 추가 정보 */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{" "}
              <a href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Create one
              </a>
            </p>
          </div>
        </div>

        {/* 기능 설명 */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white bg-opacity-60 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-sm text-gray-700 font-medium">
              AI-Powered Learning
            </p>
          </div>
          <div className="bg-white bg-opacity-60 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-sm text-gray-700 font-medium">
              Gamification System
            </p>
          </div>
          <div className="bg-white bg-opacity-60 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">🎤</div>
            <p className="text-sm text-gray-700 font-medium">
              Speaking Practice
            </p>
          </div>
          <div className="bg-white bg-opacity-60 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm text-gray-700 font-medium">
              Micro Learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
```

### app/auth/login/page.tsx (로그인 페이지 라우트)

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginPage } from "@/components/auth/LoginPage";

export default async function LoginPageRoute() {
  // 이미 로그인한 경우 대시보드로 리디렉트
  const session = await auth.api.getSession({
    headers: {
      cookie: "",
    },
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginPage />;
}
```

### components/auth/LogoutButton.tsx (로그아웃 버튼)

```typescript
"use client";

import React, { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
```

### components/shared/Header.tsx (헤더에 인증 정보 표시)

```typescript
"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";

export function Header() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="text-2xl">📚</div>
          <span className="font-bold text-xl text-gray-900">Study Eng-H</span>
        </Link>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-900 font-medium">
                  {user.name || user.email}
                </span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

## 🛡️ 미들웨어 설정 (선택사항)

### middleware.ts (페이지 접근 권한 체크)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 보호되어야 할 라우트
const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const authRoutes = ["/auth/login", "/auth/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 라우트는 통과
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 세션 확인
  try {
    // Better-Auth에서 세션 확인
    // (구현 방식은 Better-Auth 문서 참조)

    // 임시 구현 - 실제는 쿠키 확인
    const session = request.cookies.get("better-auth.session_token");

    if (!session) {
      // 로그인 페이지로 리디렉트
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로와 매칭:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (favicon 파일)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 🧪 테스트 방법

### 로컬 개발 환경 테스트

```bash
# 1. 개발 서버 시작
npm run dev

# 2. http://localhost:3000/auth/login 접속

# 3. "Sign in with Kakao" 클릭

# 4. Kakao 로그인 페이지에서 인증

# 5. 성공 시 /dashboard로 리디렉트
```

### 테스트 계정

Kakao Developers에서 테스트 계정 설정:

```
1. 앱 설정 → 테스트 사용자
2. 테스트 사용자 추가
3. 추가된 계정으로 테스트 (SMS 불필요)
```

### 디버깅 팁

```typescript
// 개발 중 콘솔에서 인증 상태 확인
// Browser DevTools Console

// 로컬 스토리지 확인
localStorage.getItem("better-auth.session_token")

// 쿠키 확인
document.cookie

// 네트워크 탭에서 /api/auth 요청 확인
```

---

## 🚀 배포 설정

### 프로덕션 환경 (Vercel 예시)

#### 1. Vercel 환경 변수 설정

```
KAKAO_ID=YOUR_PROD_KAKAO_ID
KAKAO_SECRET=YOUR_PROD_KAKAO_SECRET
KAKAO_REDIRECT_URI=https://yourdomain.com/api/auth/callback/kakao
BETTER_AUTH_URL=https://yourdomain.com
BETTER_AUTH_SECRET=your-prod-secret-key
DATABASE_URL=your-prod-database-url
```

#### 2. Kakao 개발자 콘솔에서 리다이렉트 URI 추가

```
앱 설정 → Kakao Login → Redirect URI

프로덕션 추가:
https://yourdomain.com/api/auth/callback/kakao
```

#### 3. Vercel 배포

```bash
# Git에 푸시
git push origin main

# 자동 배포 또는 수동 배포
```

---

## 🔍 일반적인 문제 해결

### 1. "Redirect URI mismatch" 오류

```
해결책:
1. Kakao Developers 콘솔에서 등록한 Redirect URI 확인
2. .env.local의 KAKAO_REDIRECT_URI와 일치하는지 확인
3. 포트 번호 확인 (http://localhost:3000 vs http://127.0.0.1:3000)
4. 프로토콜 확인 (http vs https)
```

### 2. "Invalid client ID" 오류

```
해결책:
1. KAKAO_ID가 올바르게 설정되어 있는지 확인
2. 앱 설정에서 REST API 키 확인
3. .env.local 파일 재로드 (개발 서버 재시작)
```

### 3. 세션이 유지되지 않음

```
해결책:
1. BETTER_AUTH_SECRET이 최소 32자 이상인지 확인
2. 쿠키 설정 확인 (SameSite, Secure 등)
3. 데이터베이스 연결 확인
```

### 4. CSRF 토큰 오류

```
해결책:
1. Better-Auth 최신 버전 업데이트
2. nextCookies() 플러그인 활성화 확인
3. API 라우트 설정 재확인
```

---

## 📚 참고 자료

### 공식 문서
- [Better-Auth 공식 문서](https://better-auth.com/)
- [Kakao Developers](https://developers.kakao.com/)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

### 유용한 링크
- [Better-Auth GitHub](https://github.com/better-auth/better-auth)
- [Kakao OAuth 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Prisma 문서](https://www.prisma.io/docs/)

---

## ✅ 체크리스트

### 설정 단계
- [ ] Kakao Developers 앱 등록
- [ ] 클라이언트 ID/Secret 획득
- [ ] Redirect URI 등록
- [ ] 필수 동의항목 설정

### 개발 단계
- [ ] Better-Auth 패키지 설치
- [ ] 환경 변수 설정
- [ ] Prisma 스키마 작성
- [ ] 데이터베이스 마이그레이션
- [ ] 인증 설정 (lib/auth.ts)
- [ ] API 라우트 설정
- [ ] 클라이언트 코드 구현
- [ ] 로그인 페이지 구현

### 테스트 단계
- [ ] 로컬 로그인 테스트
- [ ] 세션 관리 테스트
- [ ] 로그아웃 테스트
- [ ] 오류 처리 테스트
- [ ] 모바일 반응형 테스트

### 배포 단계
- [ ] 프로덕션 Kakao 앱 설정
- [ ] 환경 변수 설정
- [ ] 리다이렉트 URI 추가
- [ ] 배포 및 테스트
- [ ] 모니터링 설정

---

## 📝 다음 단계

### Phase 1 인증 완료 후
1. ✅ AI 레벨 진단 구현
2. ✅ 한글→영어 퀴즈 시스템
3. ✅ 어휘 학습 기능
4. ✅ 발음 진단 시스템

### Phase 2 준비
1. 🔄 Naver 소셜 로그인 추가
2. 🔄 이메일 기반 가입 추가
3. 🔄 소셜 계정 연동 기능
4. 🔄 프로필 관리 페이지

---

**최종 업데이트**: 2026-01-30
**문서 버전**: v1.0 (Better-Auth Kakao 초기 구현)
